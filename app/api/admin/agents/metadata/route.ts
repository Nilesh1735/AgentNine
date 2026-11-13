import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { getSupabaseAdminServer } from "@/lib/supabase";
import { invalidateCatalogAgents } from "@/lib/catalog-cache";
import { timingSafeStringEqual } from "@/lib/timing-safe";

// Vercel's default is 300s; declare it so the budget below is explicit and portable.
export const maxDuration = 300;

function repositoryPath(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname.toLowerCase() !== "github.com") return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    const owner = parts[0];
    const repository = parts[1].replace(/\.git$/, "");
    if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repository)) return null;
    return `${owner}/${repository}`;
  } catch {
    return null;
  }
}

/** Statuses whose upstream metadata is worth refreshing. Archived rows are skipped. */
const REFRESHABLE_STATUSES = ["published", "needs_review", "draft"];

/**
 * Rows processed per run. Oldest-checked first, so consecutive runs sweep the whole
 * catalogue without storing a cursor. Sized so a run finishes well inside MAX_RUN_MS
 * even when every repository is slow.
 */
const BATCH_SIZE = 150;

/** Wall-clock budget, kept below the route's maxDuration so results can still be written. */
const MAX_RUN_MS = 240_000;

async function refreshMetadata() {
  const db = getSupabaseAdminServer();
  if (!db) return { error: "Admin data access is unavailable", status: 503 as const };
  const database = db;
  const { data: agents, error: loadError } = await db
    .from("agents")
    .select("id, github_url, metadata_last_checked_at")
    .in("status", REFRESHABLE_STATUSES)
    .order("metadata_last_checked_at", { ascending: true, nullsFirst: true })
    .limit(BATCH_SIZE);
  if (loadError) return { error: "Unable to load agents", status: 503 as const };
  const headers: HeadersInit = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
  const githubToken = process.env.GITHUB_TOKEN;
  if (githubToken) headers.Authorization = "Bearer " + githubToken;
  const configuredAuth = Boolean(githubToken);
  if (!configuredAuth) {
    console.error(
      "[metadata] GITHUB_TOKEN is not configured. Unauthenticated GitHub access is limited to "
      + "60 requests/hour, so this run will stop early and the catalogue will not be fully refreshed.",
    );
  }
  const deadline = Date.now() + MAX_RUN_MS;
  let updated = 0;
  const failures: Array<{ url: string; reason: string }> = [];

  /**
   * Records that a row was attempted and the attempt failed.
   *
   * The batch is ordered by metadata_last_checked_at ascending, so a row whose
   * timestamp never advances stays at the head of every future batch. A permanently
   * broken repository (deleted upstream, malformed URL) would otherwise occupy a slot
   * forever and starve rows behind it once the catalogue exceeds BATCH_SIZE.
   * Stamping the attempt rotates the row out, while metadata_is_stale keeps it in the
   * admin staleness worklist, which selects on
   * metadata_is_stale.eq.true,metadata_last_checked_at.is.null.
   */
  async function recordFailedAttempt(agentId: string) {
    // Bound to a local because the null check above does not narrow inside a closure.
    const { error } = await database
      .from("agents")
      .update({ metadata_last_checked_at: new Date().toISOString(), metadata_is_stale: true })
      .eq("id", agentId);
    if (error) console.error("[metadata] Could not record a failed attempt:", error.message);
  }

  for (const agent of agents ?? []) {
    if (Date.now() >= deadline) {
      failures.push({ url: "", reason: "Metadata refresh deadline reached; the next run continues from the oldest unchecked record." });
      break;
    }
    const repo = repositoryPath(agent.github_url);
    if (!repo) {
      failures.push({ url: agent.github_url, reason: "invalid GitHub repository URL" });
      await recordFailedAttempt(agent.id);
      continue;
    }
    let response: Response;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        response = await fetch(`https://api.github.com/repos/${repo}`, { headers, cache: "no-store", signal: controller.signal });
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      failures.push({ url: agent.github_url, reason: error instanceof Error && error.name === "AbortError" ? "GitHub request timed out" : "GitHub request failed" });
      await recordFailedAttempt(agent.id);
      continue;
    }
    if (!response.ok) {
      const remaining = response.headers.get("x-ratelimit-remaining");
      const reason = response.status === 401
        ? "GitHub token was rejected; replace GITHUB_TOKEN"
        : response.status === 403 && remaining === "0"
          ? "GitHub API rate limit exhausted; configure or replace GITHUB_TOKEN"
          : response.status === 403 && !configuredAuth
            ? "GitHub denied the unauthenticated request; configure GITHUB_TOKEN"
            : `GitHub returned HTTP ${response.status}`;
      failures.push({ url: agent.github_url, reason });
      // Token and quota problems are systemic rather than per-row: stop without
      // stamping, so these rows are retried first once the credential is fixed.
      if (response.status === 401 || (response.status === 403 && (remaining === "0" || !configuredAuth))) break;
      await recordFailedAttempt(agent.id);
      continue;
    }
    const data = await response.json() as { stargazers_count?: unknown; pushed_at?: unknown; default_branch?: unknown; archived?: unknown };
    const stars = typeof data.stargazers_count === "number" ? data.stargazers_count : null;
    const lastCommitAt = typeof data.pushed_at === "string" ? data.pushed_at : null;
    const { error } = await db.from("agents").update({
      stars,
      last_commit_at: lastCommitAt,
      upstream_default_branch: typeof data.default_branch === "string" ? data.default_branch : null,
      upstream_is_archived: typeof data.archived === "boolean" ? data.archived : null,
      metadata_last_checked_at: new Date().toISOString(),
      metadata_source: "github",
      metadata_is_stale: false,
    }).eq("id", agent.id);
    if (error) {
      failures.push({ url: agent.github_url, reason: "Supabase update failed" });
      // The full update carries the timestamp, so a failure here leaves the row at
      // the head of the queue. Retry with just the two cursor columns: a failure
      // caused by one of the metadata values will not repeat for these.
      await recordFailedAttempt(agent.id);
    } else updated += 1;
  }
  if (updated > 0) invalidateCatalogAgents();
  // The response body is not read by the cron caller, so surface the outcome in the
  // platform logs: without this a failing refresh is invisible until someone notices
  // stale listings a week later.
  if (failures.length) {
    console.error(`[metadata] Refreshed ${updated} agent(s); ${failures.length} failed:`, failures);
  } else {
    console.info(`[metadata] Refreshed ${updated} agent(s) with no failures.`);
  }
  return { updated, failed: failures.length, failures };
}

function responseFor(result: Awaited<ReturnType<typeof refreshMetadata>>) {
  return NextResponse.json(result, "status" in result ? { status: result.status } : undefined);
}

export async function PUT(request: NextRequest) {
  if (!await isAdminRequest(request, true)) return NextResponse.json({ error: "Unauthorized or invalid CSRF token" }, { status: 403 });
  return responseFor(await refreshMetadata());
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  // Timing-safe, matching every other secret comparison in the codebase.
  if (!secret || !timingSafeStringEqual("Bearer " + secret, authorization ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return responseFor(await refreshMetadata());
}
