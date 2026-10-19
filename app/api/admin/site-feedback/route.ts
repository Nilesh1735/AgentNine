import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { getSupabaseAdminServer } from "@/lib/supabase";
import { jsonBodyError, readJsonBody } from "@/lib/request-security";
import type { SiteFeedbackStatus } from "@/lib/site-feedback";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const statusValues = new Set<SiteFeedbackStatus>(["pending", "published", "rejected"]);

export async function GET(request: NextRequest) {
  if (!await isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const db = getSupabaseAdminServer();
  if (!db) return NextResponse.json({ error: "Admin data access is unavailable." }, { status: 503 });

  const { data, error } = await db
    .from("site_feedback")
    .select("id,display_name,message,publication_consent,status,created_at,published_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    console.error("Admin site feedback could not be loaded:", error.message);
    return NextResponse.json({ error: "Feedback review is unavailable." }, { status: 503 });
  }
  return NextResponse.json({ feedback: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: NextRequest) {
  if (!await isAdminRequest(request, true)) {
    return NextResponse.json({ error: "Unauthorized or invalid CSRF token." }, { status: 403 });
  }

  const parsed = await readJsonBody<unknown>(request, 4_096);
  if (!parsed.ok) return NextResponse.json(jsonBodyError(parsed), { status: parsed.status });
  if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) {
    return NextResponse.json({ error: "Invalid feedback update." }, { status: 400 });
  }

  const input = parsed.value as Record<string, unknown>;
  if (typeof input.id !== "string" || !uuidPattern.test(input.id) || typeof input.status !== "string" || !statusValues.has(input.status as SiteFeedbackStatus)) {
    return NextResponse.json({ error: "Choose a valid feedback item and status." }, { status: 400 });
  }

  const db = getSupabaseAdminServer();
  if (!db) return NextResponse.json({ error: "Admin data access is unavailable." }, { status: 503 });

  const { data: existing, error: loadError } = await db
    .from("site_feedback")
    .select("id,publication_consent")
    .eq("id", input.id)
    .maybeSingle();
  if (loadError) {
    console.error("Feedback item could not be checked before moderation:", loadError.message);
    return NextResponse.json({ error: "Feedback could not be updated." }, { status: 503 });
  }
  if (!existing) return NextResponse.json({ error: "Feedback item not found." }, { status: 404 });
  if (input.status === "published" && existing.publication_consent !== true) {
    return NextResponse.json({ error: "This submitter did not permit public display." }, { status: 400 });
  }

  const { data, error } = await db
    .from("site_feedback")
    .update({ status: input.status })
    .eq("id", input.id)
    .select("id,display_name,message,publication_consent,status,created_at,published_at")
    .single();
  if (error || !data) {
    console.error("Feedback moderation update failed:", error?.message ?? "No updated row was returned.");
    return NextResponse.json({ error: "Feedback could not be updated." }, { status: 503 });
  }
  return NextResponse.json({ feedback: data }, { headers: { "Cache-Control": "no-store" } });
}
