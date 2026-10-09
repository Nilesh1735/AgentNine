import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { getSupabaseAdminServer } from "@/lib/supabase";
import { jsonBodyError, readJsonBody } from "@/lib/request-security";

export const runtime = "nodejs";

const views = new Set(["audit", "login-history", "staleness", "broken-links", "analytics"]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const errorResponse = (message: string, status: number) => NextResponse.json({ error: message }, { status });

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

async function loadView(view: string) {
  const db = getSupabaseAdminServer();
  if (!db) return errorResponse("Admin data access is unavailable.", 503);

  if (view === "audit") {
    const { data, error } = await db
      .from("agent_change_audit")
      .select("id,agent_id,changed_by,change_reason,previous_record,new_record,changed_at")
      .order("changed_at", { ascending: false })
      .limit(50);
    if (error) {
      console.error("Admin audit history could not be loaded:", error.message);
      return errorResponse("Audit history is unavailable.", 503);
    }
    const agentIds = [...new Set((data ?? []).flatMap((row) => row.agent_id ? [row.agent_id] : []))];
    const { data: agents, error: agentError } = agentIds.length
      ? await db.from("agents").select("id,name,slug").in("id", agentIds)
      : { data: [], error: null };
    if (agentError) {
      console.error("Audit agent labels could not be loaded:", agentError.message);
      return errorResponse("Audit history is unavailable.", 503);
    }
    const agentsById = new Map((agents ?? []).map((agent) => [agent.id, agent]));
    const rows = (data ?? []).map((row) => {
      const before = objectValue(row.previous_record);
      const after = objectValue(row.new_record);
      const fields = [...new Set([...Object.keys(before), ...Object.keys(after)])]
        .filter((field) => JSON.stringify(before[field]) !== JSON.stringify(after[field]));
      const agent = row.agent_id ? agentsById.get(row.agent_id) : undefined;
      return {
        id: row.id,
        agent_name: agent?.name ?? "Deleted agent",
        agent_slug: agent?.slug ?? null,
        changed_by: row.changed_by ?? "Unknown",
        change_reason: row.change_reason ?? "Catalog change",
        changed_at: row.changed_at,
        fields,
      };
    });
    return NextResponse.json({ rows });
  }

  if (view === "login-history") {
    const { data, error } = await db
      .from("admin_login_log")
      .select("id,success,attempted_at")
      .order("attempted_at", { ascending: false })
      .limit(50);
    if (error) {
      console.error("Admin login history could not be loaded:", error.message);
      return errorResponse("Login history is unavailable.", 503);
    }
    return NextResponse.json({ rows: data ?? [] });
  }

  if (view === "staleness") {
    const { data, error } = await db
      .from("agents")
      .select("id,name,slug,github_url,metadata_last_checked_at,metadata_is_stale")
      .eq("status", "published")
      .or("metadata_is_stale.eq.true,metadata_last_checked_at.is.null")
      .order("metadata_last_checked_at", { ascending: true, nullsFirst: true })
      .limit(100);
    if (error) {
      console.error("Stale catalog worklist could not be loaded:", error.message);
      return errorResponse("The staleness worklist is unavailable.", 503);
    }
    return NextResponse.json({ rows: data ?? [] });
  }

  if (view === "broken-links") {
    const { data, error } = await db
      .from("broken_link_reports")
      .select("id,agent_slug,status,created_at,forwarded_at,forwarding_error")
      .in("status", ["pending", "in_review"])
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      console.error("Broken-link queue could not be loaded:", error.message);
      return errorResponse("The broken-link queue is unavailable.", 503);
    }
    return NextResponse.json({ rows: data ?? [] });
  }

  const { data, error } = await db.rpc("get_admin_analytics_daily", { p_days: 30 });
  if (error) {
    console.error("Admin analytics summary could not be loaded:", error.message);
    return errorResponse("Analytics summary is unavailable.", 503);
  }
  return NextResponse.json({ rows: data ?? [] });
}

export async function GET(request: NextRequest) {
  if (!await isAdminRequest(request)) return errorResponse("Unauthorized.", 401);
  const view = request.nextUrl.searchParams.get("view") ?? "";
  if (!views.has(view)) return errorResponse("Unknown operations view.", 400);
  return loadView(view);
}

export async function PATCH(request: NextRequest) {
  if (!await isAdminRequest(request, true)) return errorResponse("Unauthorized or invalid CSRF token.", 403);
  const parsed = await readJsonBody<unknown>(request, 2_048);
  if (!parsed.ok) return NextResponse.json(jsonBodyError(parsed), { status: parsed.status });
  const input = parsed.value;
  if (!input || typeof input !== "object" || Array.isArray(input)) return errorResponse("Invalid report update.", 400);
  const body = input as Record<string, unknown>;
  if (typeof body.id !== "string" || !uuid.test(body.id)) return errorResponse("Invalid report id.", 400);
  if (!["in_review", "resolved", "ignored"].includes(String(body.status))) return errorResponse("Invalid report status.", 400);

  const db = getSupabaseAdminServer();
  if (!db) return errorResponse("Admin data access is unavailable.", 503);
  const status = body.status as "in_review" | "resolved" | "ignored";
  const resolved = status === "resolved" || status === "ignored";
  const { data, error } = await db
    .from("broken_link_reports")
    .update({
      status,
      resolved_at: resolved ? new Date().toISOString() : null,
      resolved_by: resolved ? "admin" : null,
    })
    .eq("id", body.id)
    .select("id,status")
    .maybeSingle();
  if (error) {
    console.error("Broken-link report could not be updated:", error.message);
    return errorResponse("The report status could not be saved.", 503);
  }
  if (!data) return errorResponse("Report not found.", 404);
  return NextResponse.json(data);
}
