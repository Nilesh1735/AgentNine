import { NextResponse } from "next/server";
import { getSupabaseAdminServer, getSupabasePublicServer } from "@/lib/supabase";
import { checkRequestRateLimit } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/rate-limit-response";
import { normalizeAnalyticsPagePath } from "@/lib/analytics-validation";
import { getClientIp, jsonBodyError, readJsonBody } from "@/lib/request-security";
import { getVisitorId } from "@/lib/visitor-state-server";

const eventNames = new Set(["agent_view", "search", "search_success", "search_zero_results", "feedback_submitted", "source_click", "agent_saved", "comparison_changed", "api_error", "admin_error"]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowedProperties: Record<string, Set<string>> = {
  agent_view: new Set(["slug", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]),
  search: new Set(["queryLength", "filterCount", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]),
  feedback_submitted: new Set(["slug", "helpful", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]),
  source_click: new Set(["slug", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]),
  search_success: new Set(["resultCount", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]),
  search_zero_results: new Set(["filterCount", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]),
  agent_saved: new Set(["slug", "action", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]),
  comparison_changed: new Set(["slug", "action", "selectionCount", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]),
  api_error: new Set(["endpoint", "status", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]),
  admin_error: new Set(["endpoint", "status", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]),
};

export async function POST(request: Request) {
  const client = getClientIp(request);
  const limitResponse = rateLimitResponse(
    await checkRequestRateLimit(`analytics:${client}`, 120, 60_000),
    "Analytics is rate limited.",
  );
  if (limitResponse) return limitResponse;
  const parsed = await readJsonBody<unknown>(request, 16_384);
  if (!parsed.ok) return NextResponse.json(jsonBodyError(parsed), { status: parsed.status });
  const body = parsed.value;
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const input = body as Record<string, unknown>;
  if (input.consent !== "accepted") {
    return NextResponse.json({ error: "Analytics consent is required.", code: "consent_required" }, { status: 403 });
  }
  const sessionId = typeof input.sessionId === "string" ? input.sessionId : "";
  const requestedPagePath = typeof input.pagePath === "string" ? input.pagePath : "";
  const pagePath = normalizeAnalyticsPagePath(requestedPagePath);
  const eventInputs = "events" in input
    ? input.events
    : [{ eventName: input.eventName, properties: input.properties }];
  if (!uuidPattern.test(sessionId) || !(pagePath === "/" || /^\/[^/]/.test(pagePath)) || pagePath.length > 500 || !Array.isArray(eventInputs) || eventInputs.length < 1 || eventInputs.length > 3) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const rows: Array<{
    event_name: string;
    session_id: string;
    page_path: string;
    properties: Record<string, unknown>;
  }> = [];
  for (const event of eventInputs) {
    if (!event || typeof event !== "object" || Array.isArray(event)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    const eventName = typeof event.eventName === "string" ? event.eventName : "";
    const properties = event.properties;
    if (!eventNames.has(eventName) || !properties || typeof properties !== "object" || Array.isArray(properties)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    const propertyEntries = Object.entries(properties as Record<string, unknown>);
    const allowed = allowedProperties[eventName];
    if (propertyEntries.length > allowed.size || propertyEntries.some(([key, value]) => !allowed.has(key) || !["string", "number", "boolean"].includes(typeof value) || (typeof value === "string" && value.length > 120))) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    rows.push({ event_name: eventName, session_id: sessionId, page_path: pagePath, properties });
  }
  const visitorId = getVisitorId(request);
  const adminClient = getSupabaseAdminServer();
  if (!visitorId || !adminClient) {
    return NextResponse.json({ error: "Analytics consent is required.", code: "consent_required" }, { status: 403 });
  }
  const { data: preferenceRow, error: preferenceError } = await adminClient
    .from("visitor_preferences")
    .select("preferences")
    .eq("visitor_id", visitorId)
    .maybeSingle();
  const storedPreferences = preferenceRow?.preferences as { analyticsConsent?: string; analyticsSessionId?: string } | null;
  if (preferenceError || storedPreferences?.analyticsConsent !== "accepted" || storedPreferences.analyticsSessionId !== sessionId) {
    return NextResponse.json({ error: "Analytics consent is required.", code: "consent_required" }, { status: 403 });
  }
  const supabase = getSupabasePublicServer();
  if (!supabase) return NextResponse.json({ error: "Analytics service unavailable" }, { status: 503 });
  const { error } = await supabase.from("analytics_events").insert(rows);
  return error ? NextResponse.json({ error: "Event was not recorded" }, { status: 503 }) : NextResponse.json({ ok: true });
}
