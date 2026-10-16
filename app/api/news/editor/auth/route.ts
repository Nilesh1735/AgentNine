import { NextRequest, NextResponse } from "next/server";
import { getClientIp, jsonBodyError, readJsonBody } from "@/lib/request-security";
import {
  createNewsEditorSession,
  getNewsEditorKey,
  getNewsEditorSession,
  isValidNewsEditorKey,
  newsEditorCookieNames,
  newsEditorCookieOptions,
} from "@/lib/news-editor-auth";
import { isTrustedOrigin } from "@/lib/admin";
import { checkRequestRateLimit } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/rate-limit-response";

export async function GET(request: NextRequest) {
  const session = getNewsEditorSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ csrf: session.csrf });
}

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const key = getNewsEditorKey();
  if (!key) {
    console.error("News editor authentication is unavailable: NEWS_EDITOR_KEY must contain at least 32 characters.");
    return NextResponse.json({ error: "News editor authentication is not configured." }, { status: 503 });
  }
  const limitResponse = rateLimitResponse(
    await checkRequestRateLimit(`news-editor-login:${getClientIp(request)}`, 5, 15 * 60 * 1000),
    "Too many attempts. Try again later.",
  );
  if (limitResponse) return limitResponse;
  const parsed = await readJsonBody<unknown>(request, 2_048);
  if (!parsed.ok) return NextResponse.json(jsonBodyError(parsed), { status: parsed.status });
  const body = parsed.value;
  const supplied = body && typeof body === "object" && typeof (body as Record<string, unknown>).key === "string"
    ? (body as Record<string, string>).key
    : "";
  if (!isValidNewsEditorKey(supplied)) {
    return NextResponse.json({ error: "The news editor key is incorrect." }, { status: 401 });
  }

  try {
    const { session, csrf } = createNewsEditorSession();
    const response = NextResponse.json({ ok: true, csrf });
    response.cookies.set(newsEditorCookieNames.session, session, newsEditorCookieOptions);
    response.cookies.set(newsEditorCookieNames.csrf, csrf, {
      httpOnly: false,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: newsEditorCookieOptions.maxAge,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("News editor session could not be created:", error);
    return NextResponse.json({ error: "News editor authentication is unavailable." }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isTrustedOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(newsEditorCookieNames.session);
  response.cookies.delete(newsEditorCookieNames.csrf);
  return response;
}
