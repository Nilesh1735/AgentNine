import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { getSupabaseAdminServer } from "@/lib/supabase";
import { jsonBodyError, readJsonBody } from "@/lib/request-security";
import { isContactDeliveryConfigured, sendContactDelivery } from "@/lib/contact-delivery";

export const runtime = "nodejs";

const views = new Set(["audit", "login-history", "staleness", "broken-links", "contact-delivery", "analytics"]);
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

  if (view === "contact-delivery") {
    const { data: deliveries, error } = await db
      .from("contact_delivery_outbox")
      .select("id,submission_id,status,attempt_count,last_error,created_at,updated_at")
      .in("status", ["pending", "failed", "sending"])
      .order("updated_at", { ascending: true })
      .limit(100);
    if (error) {
      console.error("Contact delivery queue could not be loaded:", error.message);
      return errorResponse("The contact delivery queue is unavailable.", 503);
    }

    const submissionIds = [...new Set((deliveries ?? []).map((delivery) => delivery.submission_id))];
    const { data: submissions, error: submissionError } = submissionIds.length
      ? await db
          .from("contribution_submissions")
          .select("id,request_type,name,email,source_url,message,created_at")
          .in("id", submissionIds)
      : { data: [], error: null };
    if (submissionError) {
      console.error("Contact delivery details could not be loaded:", submissionError.message);
      return errorResponse("The contact delivery queue is unavailable.", 503);
    }

    const submissionsById = new Map((submissions ?? []).map((submission) => [submission.id, submission]));
    const retryCutoff = Date.now() - 10 * 60_000;
    const deliveryConfigured = isContactDeliveryConfigured();
    const rows = (deliveries ?? [])
      .flatMap((delivery) => {
        const submission = submissionsById.get(delivery.submission_id);
        if (!submission) return [];
        const staleSending = delivery.status === "sending" && new Date(delivery.updated_at).getTime() < retryCutoff;
        return [{
          ...delivery,
          delivery_configured: deliveryConfigured,
          retry_available: deliveryConfigured && (delivery.status !== "sending" || staleSending),
          submission,
        }];
      })
      .slice(0, 50);
    return NextResponse.json({ rows });
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
  if (body.action === "retry-contact-delivery") {
    if (typeof body.submissionId !== "string" || !uuid.test(body.submissionId)) {
      return errorResponse("Invalid contact submission id.", 400);
    }
    return retryContactDelivery(body.submissionId);
  }
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

async function retryContactDelivery(submissionId: string) {
  const db = getSupabaseAdminServer();
  if (!db) return errorResponse("Admin data access is unavailable.", 503);
  if (!isContactDeliveryConfigured()) {
    return errorResponse("Contact email delivery is not configured. The queued submission has not been changed.", 503);
  }

  const { data, error } = await db.rpc("claim_contact_delivery", { p_submission_id: submissionId });
  if (error) {
    console.error("Contact notification retry could not be claimed:", error.message);
    return errorResponse("The notification could not be claimed. Refresh the queue and try again.", 503);
  }
  if (!Array.isArray(data) || !data[0]) {
    return errorResponse("This notification is already being processed or is not ready to retry.", 409);
  }

  const submission = data[0];
  const result = await sendContactDelivery({
    requestType: submission.request_type,
    sourceUrl: submission.source_url ?? "",
    name: submission.name,
    email: submission.email,
    message: submission.message,
  });
  if (!result.ok) {
    const { error: updateError } = await db
      .from("contact_delivery_outbox")
      .update({ status: "failed", last_error: result.error, updated_at: new Date().toISOString() })
      .eq("submission_id", submissionId);
    if (updateError) console.error("Contact notification retry failure could not be recorded:", updateError.message);
    return NextResponse.json({
      error: updateError
        ? "Delivery failed and the queue status could not be updated. Refresh before retrying."
        : "Delivery failed. The item remains available in the queue for another manual retry.",
      code: result.code,
      retryMayDuplicate: result.code === "timeout",
    }, { status: result.code === "rate_limited" ? 429 : 502 });
  }

  const { error: updateError } = await db
    .from("contact_delivery_outbox")
    .update({
      status: "delivered",
      last_error: null,
      delivered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("submission_id", submissionId);
  if (updateError) {
    console.error("Contact notification succeeded but its status could not be recorded:", updateError.message);
    return NextResponse.json({
      error: "Notification was sent, but its delivery status could not be recorded. Refresh before retrying.",
      deliverySent: true,
    }, { status: 503 });
  }
  return NextResponse.json({ ok: true, deliveryStatus: "delivered" });
}
