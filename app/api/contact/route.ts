import { NextResponse } from "next/server";

import { checkRequestRateLimit } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/rate-limit-response";
import { getClientIp, jsonBodyError, readJsonBody } from "@/lib/request-security";
import { getSupabaseAdminServer, getSupabasePublicServer } from "@/lib/supabase";
import { isContactDeliveryConfigured, sendContactDelivery } from "@/lib/contact-delivery";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function profileUrl(value: unknown, host: string) {
  const rawUrl = text(value, 300);
  if (!rawUrl) return "";
  try {
    const parsedUrl = new URL(rawUrl);
    if (
      parsedUrl.protocol !== "https:" ||
      (parsedUrl.hostname !== host && parsedUrl.hostname !== `www.${host}`) ||
      parsedUrl.pathname === "/"
    ) {
      return null;
    }
    return parsedUrl.toString();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const client = getClientIp(request);
  const ipLimit = rateLimitResponse(
    await checkRequestRateLimit(`contact:${client}`, 5, 60_000),
    "Contact is rate limited. Try again shortly.",
  );
  if (ipLimit) return ipLimit;

  const parsed = await readJsonBody<unknown>(request, 8_192);
  if (!parsed.ok) return NextResponse.json(jsonBodyError(parsed), { status: parsed.status });
  const body = parsed.value;

  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request", code: "invalid_request" }, { status: 400 });
  const input = body as Record<string, unknown>;
  if (text(input.website, 100)) return NextResponse.json({ ok: true });
  if (input.privacyAcknowledged !== true) {
    return NextResponse.json({ error: "Acknowledge the Privacy policy before submitting.", code: "privacy_acknowledgement_required" }, { status: 400 });
  }

  const name = text(input.name, 120);
  const email = text(input.email, 254);
  const message = text(input.message, 4_000);
  const requestType = text(input.requestType, 40);
  const sourceUrl = text(input.sourceUrl, 500);
  const role = text(input.role, 160);
  const linkedinUrl = profileUrl(input.linkedinUrl, "linkedin.com");
  const githubUrl = profileUrl(input.githubUrl, "github.com");
  if (!name || !emailPattern.test(email) || !message || name.length < 2 || message.length < 10) {
    return NextResponse.json({ error: "Enter your name, a valid email, and a message of at least 10 characters.", code: "invalid_request" }, { status: 400 });
  }
  if (requestType === "join-request" && (linkedinUrl === null || githubUrl === null)) {
    return NextResponse.json({ error: "Enter a valid LinkedIn or GitHub profile URL, or leave the field blank.", code: "invalid_profile_url" }, { status: 400 });
  }

  let submittedBy: string | null = null;
  const authorization = request.headers.get("authorization");
  if (authorization) {
    const [scheme, token] = authorization.split(" ");
    if (scheme !== "Bearer" || !token) return NextResponse.json({ error: "Invalid account session.", code: "invalid_session" }, { status: 401 });
    const publicClient = getSupabasePublicServer();
    if (!publicClient) return NextResponse.json({ error: "Account verification is unavailable.", code: "auth_unavailable" }, { status: 503 });
    const { data, error } = await publicClient.auth.getUser(token);
    if (error || !data.user) return NextResponse.json({ error: "Your account session is invalid or expired.", code: "invalid_session" }, { status: 401 });
    if (!data.user.email || data.user.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: "Use the email address on your signed-in account, or sign out before submitting.", code: "account_email_mismatch" }, { status: 400 });
    }
    submittedBy = data.user.id;
  }

  const emailLimit = rateLimitResponse(
    await checkRequestRateLimit(`contact-email:${email.toLowerCase()}`, 3, 3_600_000),
    "That email has reached the contact limit. Try again later.",
  );
  if (emailLimit) return emailLimit;

  const normalizedType = ["correction", "agent-suggestion", "evidence", "other", "join-request"].includes(requestType) ? requestType : "other";
  const normalizedMessage = normalizedType === "join-request"
    ? [
        `Contribution area: ${role || "Not specified"}`,
        `LinkedIn: ${linkedinUrl || "Not provided"}`,
        `GitHub: ${githubUrl || "Not provided"}`,
        "",
        "Why they want to join:",
        message,
      ].join("\n")
    : message;
  const supabase = getSupabaseAdminServer();
  let storedInDatabase = false;
  let submissionId = crypto.randomUUID();
  if (supabase) {
    if (sourceUrl) {
      const { data: duplicate, error: duplicateError } = await supabase
        .from("contribution_submissions")
        .select("id")
        .eq("source_url", sourceUrl)
        .in("status", ["pending", "in_review", "accepted"])
        .limit(1);
      if (duplicateError) {
        console.error("Contribution duplicate check failed:", duplicateError.message);
        return NextResponse.json({ error: "The contribution could not be checked. Try again shortly.", code: "storage_failure" }, { status: 503 });
      }
      if (duplicate?.length) return NextResponse.json({ error: "A submission for this source is already in review.", code: "duplicate" }, { status: 409 });
    }
    const { data: createdId, error } = await supabase.rpc("create_contribution_submission_with_delivery", {
      p_request_type: normalizedType,
      p_name: name,
      p_email: email.toLowerCase(),
      p_source_url: sourceUrl || null,
      p_message: normalizedMessage,
      p_submitted_by: submittedBy,
    });
    if (error?.code === "23505") {
      return NextResponse.json({ error: "A submission for this source is already in review.", code: "duplicate" }, { status: 409 });
    }
    if (error || typeof createdId !== "string") {
      console.error("Contribution submission failed:", error?.message ?? "The database returned no submission id.");
      return NextResponse.json({ error: "The contribution could not be recorded. Try again shortly.", code: "storage_failure" }, { status: 503 });
    }
    submissionId = createdId;
    storedInDatabase = true;
  }

  if (!isContactDeliveryConfigured()) {
    if (storedInDatabase) {
      return NextResponse.json({ ok: true, stored: true, queued: true, deliveryStatus: "pending" }, { status: 202 });
    }
    return NextResponse.json({
      error: normalizedType === "join-request"
        ? "Join applications are not configured yet. Please try again later."
        : "Contact delivery is not configured. Email the address shown below instead.",
      code: "not_configured",
      stored: false,
    }, { status: 503 });
  }

  let delivery = {
    requestType: normalizedType,
    sourceUrl,
    name,
    email: email.toLowerCase(),
    message: normalizedMessage,
  };
  if (storedInDatabase && supabase) {
    const { data, error } = await supabase.rpc("claim_contact_delivery", { p_submission_id: submissionId });
    if (error || !Array.isArray(data) || !data[0]) {
      console.error("Contact notification could not be claimed:", error?.message ?? "No queue row was available.");
      return NextResponse.json({
        error: "Your submission was saved, but its email notification could not be started. It remains in the admin queue.",
        code: "delivery_queue_failure",
        stored: true,
        queued: true,
      }, { status: 503 });
    }
    delivery = {
      requestType: data[0].request_type,
      sourceUrl: data[0].source_url ?? "",
      name: data[0].name,
      email: data[0].email,
      message: data[0].message,
    };
  }

  const result = await sendContactDelivery(delivery);
  if (!result.ok) {
    if (storedInDatabase && supabase) {
      const { error } = await supabase
        .from("contact_delivery_outbox")
        .update({ status: "failed", last_error: result.error, updated_at: new Date().toISOString() })
        .eq("submission_id", submissionId);
      if (error) console.error("Failed contact delivery could not be recorded:", error.message);
    }
    const status = result.code === "rate_limited" ? 429 : result.code === "timeout" ? 504 : 502;
    return NextResponse.json({
      error: storedInDatabase
        ? "Your submission was saved, but email delivery could not be confirmed. It is queued for administrator review; please do not submit it again."
        : "The contact service could not accept your message. Try again shortly.",
      code: result.code,
      stored: storedInDatabase,
      queued: storedInDatabase,
    }, { status });
  }

  if (storedInDatabase && supabase) {
    const { error } = await supabase
      .from("contact_delivery_outbox")
      .update({ status: "delivered", last_error: null, delivered_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("submission_id", submissionId);
    if (error) {
      console.error("Successful contact delivery status could not be recorded:", error.message);
      return NextResponse.json({
        ok: true,
        stored: true,
        queued: true,
        deliveryStatus: "sending",
        message: "Your submission was saved and notification sent, but its delivery status could not be recorded.",
      });
    }
  }
  return NextResponse.json({ ok: true, stored: storedInDatabase, deliveryStatus: "delivered" });
}
