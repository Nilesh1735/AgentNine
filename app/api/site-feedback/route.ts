import { NextResponse } from "next/server";
import { checkRequestRateLimit } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/rate-limit-response";
import { getClientIp, jsonBodyError, readJsonBody } from "@/lib/request-security";
import { getSupabaseAdminServer } from "@/lib/supabase";
import { validateSiteFeedbackInput } from "@/lib/site-feedback";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limitResponse = rateLimitResponse(
    await checkRequestRateLimit(`site-feedback-public:${getClientIp(request)}`, 60, 60_000),
    "Feedback is rate limited. Try again shortly.",
  );
  if (limitResponse) return limitResponse;

  const db = getSupabaseAdminServer();
  if (!db) return NextResponse.json({ error: "Community feedback is unavailable right now." }, { status: 503 });

  try {
    const { data, error } = await db
      .from("site_feedback")
      .select("id,display_name,message,published_at")
      .eq("status", "published")
      .eq("publication_consent", true)
      .order("published_at", { ascending: false })
      .limit(3);

    if (error) {
      console.error("Published site feedback could not be loaded:", error.message);
      return NextResponse.json({ error: "Community feedback is unavailable right now." }, { status: 503 });
    }
    return NextResponse.json({ feedback: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Published site feedback request failed:", error);
    return NextResponse.json({ error: "Community feedback is unavailable right now." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const limitResponse = rateLimitResponse(
    await checkRequestRateLimit(`site-feedback-submit:${getClientIp(request)}`, 5, 60_000),
    "Feedback is rate limited. Try again shortly.",
  );
  if (limitResponse) return limitResponse;

  const parsed = await readJsonBody<unknown>(request, 8_192);
  if (!parsed.ok) return NextResponse.json(jsonBodyError(parsed), { status: parsed.status });

  const validated = validateSiteFeedbackInput(parsed.value);
  if (!validated.ok) return NextResponse.json({ error: validated.error }, { status: 400 });
  if (validated.honeypot) return NextResponse.json({ error: "Invalid submission." }, { status: 400 });

  const db = getSupabaseAdminServer();
  if (!db) return NextResponse.json({ error: "Feedback could not be saved. Try again shortly." }, { status: 503 });

  try {
    const { error } = await db.from("site_feedback").insert({
      display_name: validated.value.displayName,
      message: validated.value.message,
      publication_consent: validated.value.publicationConsent,
      status: "pending",
    });
    if (error) {
      console.error("Site feedback submission failed:", error.message);
      return NextResponse.json({ error: "Feedback could not be saved. Try again shortly." }, { status: 503 });
    }
    return NextResponse.json({ ok: true, publicationConsent: validated.value.publicationConsent }, { status: 201 });
  } catch (error) {
    console.error("Site feedback submission failed:", error);
    return NextResponse.json({ error: "Feedback could not be saved. Try again shortly." }, { status: 503 });
  }
}
