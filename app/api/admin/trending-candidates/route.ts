import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { getSupabaseAdminServer } from "@/lib/supabase";

const threeMonthsAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 92).toISOString().slice(0, 10);

export async function POST(request: NextRequest) {
  if (!await isAdminRequest(request, true)) return NextResponse.json({ error: "Unauthorized or invalid CSRF token" }, { status: 403 });
  const db = getSupabaseAdminServer();
  if (!db) return NextResponse.json({ error: "Admin data access is unavailable" }, { status: 503 });
  const headers: HeadersInit = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
  const githubToken = process.env.GITHUB_TOKEN;
  if (githubToken) headers.Authorization = "Bearer " + githubToken;
  const queries = [`topic:ai-agents pushed:>=${threeMonthsAgo} stars:>=100 archived:false`, `topic:ai-agents pushed:>=${threeMonthsAgo} stars:10..99 archived:false`];
  const repositories = new Map<string, { name: string; html_url: string; owner: string }>();
  for (const query of queries) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let response: Response;
    try {
      response = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=50`, { headers, cache: "no-store", signal: controller.signal });
    } catch {
      return NextResponse.json({ error: "GitHub candidate search timed out" }, { status: 502 });
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) return NextResponse.json({ error: "GitHub candidate search is unavailable" }, { status: 502 });
    const data = await response.json() as { items?: Array<{ full_name?: string; name?: string; html_url?: string; owner?: { login?: string } }> };
    for (const item of data.items ?? []) if (item.full_name && item.html_url && item.name && item.owner?.login) repositories.set(item.full_name, { name: item.name, html_url: item.html_url, owner: item.owner.login });
  }
  const { data: existing, error: existingError } = await db.from("trending_candidates").select("source_url");
  if (existingError) return NextResponse.json({ error: "Unable to load existing candidates" }, { status: 503 });
  const known = new Set((existing ?? []).map((row) => row.source_url));
  const rows = [...repositories.values()].filter((repo) => !known.has(repo.html_url)).map((repo) => ({ agent_name_guess: repo.name, source_type: "github_search", source_url: repo.html_url, creator_name: repo.owner, status: "pending" }));
  let added = 0;
  if (rows.length) {
    const { data, error } = await db.from("trending_candidates").upsert(rows, { onConflict: "source_url", ignoreDuplicates: true }).select("id");
    if (error) return NextResponse.json({ error: "Unable to save candidate queue" }, { status: 503 });
    added = data?.length ?? 0;
  }
  return NextResponse.json({ discovered: repositories.size, added, since: threeMonthsAgo });
}
