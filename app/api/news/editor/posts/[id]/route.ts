import { NextRequest, NextResponse } from "next/server";
import { isNewsEditorRequest } from "@/lib/news-editor-auth";
import { getSupabaseAdminServer } from "@/lib/supabase";
import { jsonBodyError, readJsonBody } from "@/lib/request-security";
import { validateNewsPostInput } from "@/lib/news-post-validation";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isNewsEditorRequest(request, true)) return NextResponse.json({ error: "Unauthorized or invalid CSRF token" }, { status: 403 });
  const { id } = await params;
  if (!uuid.test(id)) return NextResponse.json({ error: "Invalid post id." }, { status: 400 });
  const parsed = await readJsonBody<unknown>(request, 110 * 1024);
  if (!parsed.ok) return NextResponse.json(jsonBodyError(parsed), { status: parsed.status });
  const validated = validateNewsPostInput(parsed.value);
  if (!validated.ok) return NextResponse.json({ error: validated.error }, { status: 400 });
  const supabase = getSupabaseAdminServer();
  if (!supabase) return NextResponse.json({ error: "News editor database access is unavailable." }, { status: 503 });
  const { data: existing, error: loadError } = await supabase
    .from("news_posts")
    .select("slug,status")
    .eq("id", id)
    .maybeSingle();
  if (loadError) {
    console.error("News post could not be loaded for update:", loadError.message);
    return NextResponse.json({ error: "News post could not be saved." }, { status: 503 });
  }
  if (!existing) return NextResponse.json({ error: "News post not found." }, { status: 404 });
  if (existing.status === "published" && validated.value.slug !== existing.slug) {
    return NextResponse.json({ error: "The URL cannot be changed while an article is published. Save it as a draft first." }, { status: 409 });
  }
  const { data, error } = await supabase
    .from("news_posts")
    .update(validated.value)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) {
    console.error("News post could not be updated:", error.message);
    return NextResponse.json(
      { error: error.code === "23505" ? "That article URL is already in use." : "News post could not be saved." },
      { status: error.code === "23505" ? 409 : 503 },
    );
  }
  if (!data) return NextResponse.json({ error: "News post not found." }, { status: 404 });
  return NextResponse.json(data);
}
