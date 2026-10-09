import { NextResponse } from "next/server";
import { getAgent } from "@/lib/data";
import { getSupabasePublicServer } from "@/lib/supabase";
import { checkRequestRateLimit } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/rate-limit-response";
import { getClientIp, jsonBodyError, readJsonBody } from "@/lib/request-security";
import { attachVisitorCookie, getVisitorId } from "@/lib/visitor-state-server";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function summary(agentId: string) {
  const supabase = getSupabasePublicServer();
  if (!supabase) return { error: "Feedback service unavailable" as const };
  const { data, error } = await supabase.rpc("get_agent_helpfulness_summary", { p_agent_id: agentId }).maybeSingle();
  if (error) return { error: "Feedback summary unavailable" as const };
  const row = data as { helpful_count?: number; not_helpful_count?: number } | null;
  const helpful = Number(row?.helpful_count ?? 0);
  const notHelpful = Number(row?.not_helpful_count ?? 0);
  return { helpful, notHelpful, total: helpful + notHelpful };
}

export async function GET(request: Request) {
  const client = getClientIp(request);
  const limitResponse = rateLimitResponse(
    await checkRequestRateLimit(`feedback-summary:${client}`, 120, 60_000),
    "Feedback summaries are rate limited. Try again shortly.",
  );
  if (limitResponse) return limitResponse;
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  if (!slugPattern.test(slug) || slug.length > 100) return NextResponse.json({ error: "Invalid agent" }, { status: 400 });
  let agent: Awaited<ReturnType<typeof getAgent>>;
  try {
    agent = await getAgent(slug);
  } catch {
    return NextResponse.json({ error: "Agent lookup is temporarily unavailable" }, { status: 503 });
  }
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  const result = await summary(agent.id);
  return "error" in result ? NextResponse.json(result, { status: 503 }) : NextResponse.json(result);
}

export async function POST(request: Request) {
  const client = getClientIp(request);
  const limitResponse = rateLimitResponse(
    await checkRequestRateLimit(`feedback:${client}`, 30, 60_000),
    "Feedback is rate limited. Try again shortly.",
  );
  if (limitResponse) return limitResponse;
  const parsed = await readJsonBody<unknown>(request, 4_096);
  if (!parsed.ok) return NextResponse.json(jsonBodyError(parsed), { status: parsed.status });
  const body = parsed.value;
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const input = body as Record<string, unknown>;
  const slug = typeof input.slug === "string" ? input.slug : "";
  if (!slugPattern.test(slug) || typeof input.helpful !== "boolean") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const respondentId = getVisitorId(request) ?? crypto.randomUUID();
  let agent: Awaited<ReturnType<typeof getAgent>>;
  try {
    agent = await getAgent(slug);
  } catch {
    return NextResponse.json({ error: "Feedback is temporarily unavailable" }, { status: 503 });
  }
  const supabase = getSupabasePublicServer();
  if (!agent || !supabase) return NextResponse.json({ error: "Feedback is unavailable" }, { status: 503 });
  const { error } = await supabase.from("agent_helpfulness").insert({ agent_id: agent.id, respondent_id: respondentId, helpful: input.helpful });
  if (error?.code === "23505") {
    const result = await summary(agent.id);
    const response = "error" in result ? NextResponse.json(result, { status: 503 }) : NextResponse.json(result, { status: 409 });
    return attachVisitorCookie(response, respondentId);
  }
  if (error) return NextResponse.json({ error: "Feedback could not be saved" }, { status: 503 });
  const result = await summary(agent.id);
  const response = "error" in result ? NextResponse.json(result, { status: 503 }) : NextResponse.json(result);
  return attachVisitorCookie(response, respondentId);
}
