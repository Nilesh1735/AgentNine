import { NextRequest, NextResponse } from "next/server";
import { isNewsEditorRequest } from "@/lib/news-editor-auth";
import { getAllNewsPosts } from "@/lib/news";
import { getSupabaseAdminServer } from "@/lib/supabase";
import { jsonBodyError, readJsonBody } from "@/lib/request-security";
import { validateNewsPostInput } from "@/lib/news-post-validation";

const errorResponse = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function GET(request: NextRequest) {
  if (!await isNewsEditorRequest(request)) return errorResponse("Unauthorized", 401);
  try {
    return NextResponse.json(await getAllNewsPosts());
  } catch (error) {
    console.error("News editor posts request failed:", error);
    return errorResponse("News posts are unavailable. Confirm the news migration and service-role configuration.", 503);
  }
}

export async function POST(request: NextRequest) {
  if (!await isNewsEditorRequest(request, true)) return errorResponse("Unauthorized or invalid CSRF token", 403);
  const parsed = await readJsonBody<unknown>(request, 110 * 1024);
  if (!parsed.ok) return NextResponse.json(jsonBodyError(parsed), { status: parsed.status });
  const validated = validateNewsPostInput(parsed.value);
  if (!validated.ok) return errorResponse(validated.error, 400);
  const supabase = getSupabaseAdminServer();
  if (!supabase) return errorResponse("News editor database access is unavailable.", 503);
  const { data, error } = await supabase.from("news_posts").insert(validated.value).select("*").single();
  if (error) {
    console.error("News post could not be created:", error.message);
    return errorResponse(error.code === "23505" ? "That article URL is already in use." : "News post could not be saved.", error.code === "23505" ? 409 : 503);
  }
  return NextResponse.json(data, { status: 201 });
}
