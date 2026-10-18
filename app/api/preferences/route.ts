import { NextResponse } from "next/server";
import { checkRequestRateLimit } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/rate-limit-response";
import { getClientIp, jsonBodyError, readJsonBody } from "@/lib/request-security";
import { attachVisitorCookie, getVisitorId } from "@/lib/visitor-state-server";
import { getSupabaseAdminServer } from "@/lib/supabase";
import type { VisitorPreferences } from "@/lib/visitor-preferences";
import { OPTIONAL_ANALYTICS_CONSENT_VERSION } from "@/lib/google-analytics";

export const runtime = "nodejs";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const preferenceKeys = new Set(["theme", "analyticsConsent", "analyticsConsentVersion", "analyticsSessionId", "attribution", "recentAgentSlugs", "compareSlugs", "setupProgress"]);

function responseWithCookie(body: object, status: number, visitorId: string) {
  const response = NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
  return attachVisitorCookie(response, visitorId);
}

function validPatch(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const input = value as Record<string, unknown>;
  if (!Object.keys(input).length || Object.keys(input).some((key) => !preferenceKeys.has(key))) return false;
  if ("theme" in input && input.theme !== null && input.theme !== "light" && input.theme !== "dark") return false;
  if ("analyticsConsent" in input && input.analyticsConsent !== null && input.analyticsConsent !== "accepted" && input.analyticsConsent !== "declined") return false;
  if ("analyticsConsentVersion" in input
    && input.analyticsConsentVersion !== null
    && input.analyticsConsentVersion !== OPTIONAL_ANALYTICS_CONSENT_VERSION) return false;
  if ("analyticsSessionId" in input && input.analyticsSessionId !== null) return false;
  if ("attribution" in input && input.attribution !== null) return false;
  for (const key of ["recentAgentSlugs", "compareSlugs"] as const) {
    if (!(key in input) || input[key] === null) continue;
    const items = input[key];
    const max = key === "recentAgentSlugs" ? 5 : 3;
    if (!Array.isArray(items) || items.length > max || items.some((item) => typeof item !== "string" || item.length > 100 || !slugPattern.test(item))) return false;
  }
  if ("setupProgress" in input && input.setupProgress !== null) {
    const progress = input.setupProgress;
    if (!progress || typeof progress !== "object" || Array.isArray(progress)) return false;
    const entries = Object.entries(progress as Record<string, unknown>);
    if (entries.length > 100 || entries.some(([key, item]) => !/^(?:agentnine|agenthive):setup:[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key) || typeof item !== "number" || !Number.isInteger(item) || item < -1 || item > 500)) return false;
  }
  return true;
}

function getOrCreateVisitorId(request: Request) {
  return getVisitorId(request) ?? crypto.randomUUID();
}

async function checkLimit(request: Request, operation: "read" | "write") {
  const result = await checkRequestRateLimit(
    `visitor-preferences:${operation}:${getClientIp(request)}`,
    operation === "read" ? 120 : 60,
    60_000,
  );
  return rateLimitResponse(result, "Preferences are rate limited. Try again shortly.");
}

export async function GET(request: Request) {
  const limited = await checkLimit(request, "read");
  if (limited) return limited;
  const visitorId = getOrCreateVisitorId(request);
  const supabase = getSupabaseAdminServer();
  if (!supabase) return responseWithCookie({ error: "Preferences service unavailable" }, 503, visitorId);
  const { data, error } = await supabase
    .from("visitor_preferences")
    .select("preferences")
    .eq("visitor_id", visitorId)
    .maybeSingle();
  if (error) {
    console.error("[GET /api/preferences] Query error:", error);
    return responseWithCookie({ error: "Preferences could not be loaded" }, 503, visitorId);
  }
  let preferences = (data?.preferences ?? {}) as VisitorPreferences;
  if (!data) {
    const { data: created, error: createError } = await supabase
      .rpc("merge_visitor_preferences", { p_visitor_id: visitorId, p_patch: {} });
    if (createError) {
      console.error("[GET /api/preferences] RPC init error:", createError);
      return responseWithCookie({ error: "Preferences could not be initialized" }, 503, visitorId);
    }
    preferences = (created ?? {}) as VisitorPreferences;
  }
  return responseWithCookie({ preferences }, 200, visitorId);
}

export async function PATCH(request: Request) {
  const limited = await checkLimit(request, "write");
  if (limited) return limited;
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const requestOrigin = new URL(request.url);
      const requestHost = request.headers.get("host");
      const forwardedProtocol = process.env.TRUSTED_PROXY_HEADERS === "true"
        ? request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim()
        : undefined;
      if (requestHost) requestOrigin.host = requestHost;
      if (forwardedProtocol === "http" || forwardedProtocol === "https") {
        requestOrigin.protocol = `${forwardedProtocol}:`;
      }
      if (new URL(origin).origin !== requestOrigin.origin) {
        return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid origin" }, { status: 400 });
    }
  }
  const parsed = await readJsonBody<unknown>(request, 8_192);
  if (!parsed.ok) return NextResponse.json(jsonBodyError(parsed), { status: parsed.status });
  if (!validPatch(parsed.value)) return NextResponse.json({ error: "Invalid preferences" }, { status: 400 });
  const visitorId = getOrCreateVisitorId(request);
  const supabase = getSupabaseAdminServer();
  if (!supabase) return responseWithCookie({ error: "Preferences service unavailable" }, 503, visitorId);
  const { data, error } = await supabase.rpc("merge_visitor_preferences", {
    p_visitor_id: visitorId,
    p_patch: parsed.value,
  });
  if (error) {
    console.error("[PATCH /api/preferences] RPC error:", error);
    return responseWithCookie({ error: "Preferences could not be saved" }, 503, visitorId);
  }
  return responseWithCookie({ preferences: (data ?? {}) as VisitorPreferences }, 200, visitorId);
}
