import { NextResponse } from "next/server";

import { checkRequestRateLimit } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/rate-limit-response";
import { getClientIp, jsonBodyError, readJsonBody } from "@/lib/request-security";
import { getSupabaseAdminServer } from "@/lib/supabase";

export async function POST(request: Request) {
  const parsed = await readJsonBody<unknown>(request, 2_048);
  if (!parsed.ok) return NextResponse.json(jsonBodyError(parsed), { status: parsed.status });
  const body = parsed.value;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request", code: "invalid_request" }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  if (typeof input.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug) || input.slug.length > 100) {
    return NextResponse.json({ error: "Invalid request", code: "invalid_request" }, { status: 400 });
  }
  const client = getClientIp(request);
  const limitResponse = rateLimitResponse(
    await checkRequestRateLimit(`report:${client}`, 5, 60_000),
    "Reporting is rate limited. Try again shortly.",
  );
  if (limitResponse) return limitResponse;
  const supabase = getSupabaseAdminServer();
  if (!supabase) return NextResponse.json({ error: "Reporting is not configured", code: "not_configured" }, { status: 503 });
  const { data: report, error: insertError } = await supabase
    .from("broken_link_reports")
    .insert({ agent_slug: input.slug })
    .select("id")
    .single();
  if (insertError || !report) {
    console.error("Broken-link report could not be queued:", insertError?.message ?? "No report row returned");
    return NextResponse.json({ error: "The report could not be recorded. Try again shortly.", code: "storage_failure" }, { status: 503 });
  }

  const recordForwardingFailure = async (reason: string) => {
    const { error } = await supabase
      .from("broken_link_reports")
      .update({ forwarding_error: reason })
      .eq("id", report.id);
    if (error) console.error("Broken-link report forwarding failure could not be recorded:", error.message);
  };
  const lambdaUrl = process.env.REPORT_LAMBDA_URL;
  if (!lambdaUrl) {
    await recordForwardingFailure("REPORT_LAMBDA_URL is not configured");
    return NextResponse.json({ ok: true, queued: true });
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const upstream = await fetch(lambdaUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "report-broken-link", slug: input.slug }),
        signal: controller.signal,
      });
      if (!upstream.ok) {
        const reason = `Reporting service returned HTTP ${upstream.status}`;
        await recordForwardingFailure(reason);
        return NextResponse.json({ ok: true, queued: true });
      }
      const { error } = await supabase
        .from("broken_link_reports")
        .update({ forwarded_at: new Date().toISOString(), forwarding_error: null })
        .eq("id", report.id);
      if (error) console.error("Broken-link report forwarding status could not be updated:", error.message);
      return NextResponse.json({ ok: true, queued: true });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    const reason = error instanceof DOMException && error.name === "AbortError"
      ? "Reporting service timed out"
      : "Reporting service could not be reached";
    console.error("Broken-link report forwarding failed:", error);
    await recordForwardingFailure(reason);
    return NextResponse.json({ ok: true, queued: true });
  }
}
