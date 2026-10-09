import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { getSupabaseAdminServer } from "@/lib/supabase";
import { invalidateCatalogAgents } from "@/lib/catalog-cache";

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

async function refreshMetadata() {
  const db = getSupabaseAdminServer();
  if (!db) return { error: "Admin data access is unavailable", status: 503 as const };
  const { data: agents, error: loadError } = await db.from("agents").select("id, github_url");
  if (loadError) return { error: "Unable to load agents", status: 503 as const };
  const headers: HeadersInit = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
  const githubToken = process.env.GITHUB_TOKEN;
  if (githubToken) headers.Authorization = "Bearer " + githubToken;
  const configuredAuth = Boolean(githubToken);
  const deadline = Date.now() + 45_000;
  let updated = 0;
  const failures: Array<{ url: string; reason: string }> = [];
  for (const agent of agents ?? []) {
    if (Date.now() >= deadline) {
      failures.push({ url: "", reason: "Metadata refresh deadline reached; run again to continue." });
      break;
    }
    const repo = repositoryPath(agent.github_url);
    if (!repo) {
      failures.push({ url: agent.github_url, reason: "invalid GitHub repository URL" });
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
      if (response.status === 401 || (response.status === 403 && (remaining === "0" || !configuredAuth))) break;
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
    if (error) failures.push({ url: agent.github_url, reason: "Supabase update failed" });
    else updated += 1;
  }
  if (updated > 0) invalidateCatalogAgents();
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
  if (!secret || authorization !== "Bearer " + secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return responseFor(await refreshMetadata());
}
