import { NextResponse } from "next/server";

import { checkRequestRateLimit } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/rate-limit-response";
import { getClientIp, jsonBodyError, readJsonBody } from "@/lib/request-security";
import { getSupabaseAdminServer, getSupabasePublicServer } from "@/lib/supabase";
import { getContactEmail } from "@/lib/config";

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

async function sendWithResend({
  apiKey,
  from,
  to,
  replyTo,
  subject,
  text,
  signal,
}: {
  apiKey: string;
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
  signal: AbortSignal;
}) {
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: replyTo,
      subject,
      text,
    }),
    signal,
  });
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
    const { error } = await supabase.from("contribution_submissions").insert({
      request_type: normalizedType,
      name,
      email: email.toLowerCase(),
      source_url: sourceUrl || null,
      message: normalizedMessage,
      submitted_by: submittedBy,
    });
    if (error?.code === "23505") {
      return NextResponse.json({ error: "A submission for this source is already in review.", code: "duplicate" }, { status: 409 });
    }
    if (error && error.code !== "42P01") {
      console.error("Contribution submission failed:", error.message);
      return NextResponse.json({ error: "The contribution could not be recorded. Try again shortly.", code: "storage_failure" }, { status: 503 });
    }
    storedInDatabase = !error;
  }

  const endpoint = process.env.CONTACT_LAMBDA_URL?.trim();
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const contactFromEmail = process.env.CONTACT_FROM_EMAIL?.trim()
    || (resendApiKey && process.env.NODE_ENV === "development" ? "onboarding@resend.dev" : "");
  const contactEmail = getContactEmail();
  if (!endpoint && !resendApiKey && !contactFromEmail) {
    if (normalizedType === "join-request" && storedInDatabase) {
      return NextResponse.json({ ok: true, stored: true });
    }
    if (normalizedType === "join-request") {
      return NextResponse.json({ error: "Join applications are not configured yet. Please try again later.", code: "not_configured" }, { status: 503 });
    }
    return NextResponse.json({ error: "Contact delivery is not configured. Email the address shown below instead.", code: "not_configured" }, { status: 503 });
  }

  if (!endpoint && (!resendApiKey || !contactFromEmail || !contactEmail)) {
    console.error("Contact delivery configuration is incomplete: configure CONTACT_LAMBDA_URL or RESEND_API_KEY, CONTACT_FROM_EMAIL, and NEXT_PUBLIC_CONTACT_EMAIL.");
    return NextResponse.json({ error: "Contact delivery is not fully configured. Please email the address shown below instead.", code: "delivery_misconfigured" }, { status: 503 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    let upstream: Response;
    if (endpoint) {
      upstream = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "contact", requestType: normalizedType, sourceUrl, name, email, message: normalizedMessage }),
        signal: controller.signal,
      });
    } else if (resendApiKey && contactFromEmail && contactEmail) {
      upstream = await sendWithResend({
        apiKey: resendApiKey,
        from: contactFromEmail,
        to: contactEmail,
        replyTo: email,
        subject: `AgentNine ${normalizedType.replaceAll("-", " ")}`,
        text: [
          `Request type: ${normalizedType}`,
          `Name: ${name}`,
          `Email: ${email}`,
          `Repository or listing URL: ${sourceUrl || "Not provided"}`,
          "",
          "Message:",
          normalizedMessage,
        ].join("\n"),
        signal: controller.signal,
      });
    } else {
      return NextResponse.json({ error: "Contact delivery is not fully configured. Please email the address shown below instead.", code: "delivery_misconfigured" }, { status: 503 });
    }
    if (upstream.status === 429) return NextResponse.json({ error: "Contact delivery is rate limited. Try again shortly.", code: "rate_limited" }, { status: 429 });
    if (!upstream.ok) {
      console.error(`Contact provider rejected a submission with HTTP ${upstream.status}.`);
      return NextResponse.json({ error: "The contact service could not accept your message.", code: "upstream_failure" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, stored: storedInDatabase });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return NextResponse.json({ error: "The contact service took too long to respond. Try again shortly.", code: "timeout" }, { status: 504 });
    }
    return NextResponse.json({ error: "The contact service is unavailable. Try again shortly.", code: "unavailable" }, { status: 503 });
  } finally {
    clearTimeout(timeout);
  }
}
