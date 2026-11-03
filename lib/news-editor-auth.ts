import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { isTrustedOrigin } from "@/lib/admin";
import { getSupabaseAdminServer } from "@/lib/supabase";

const SESSION_SECONDS = 60 * 60 * 2;
const SESSION_COOKIE = "news_editor_session";
const CSRF_COOKIE = "news_editor_csrf";
const MINIMUM_KEY_LENGTH = 32;

function timingSafeNewsEditorKeyEqual(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return leftBytes.length === rightBytes.length && crypto.timingSafeEqual(leftBytes, rightBytes);
}

type NewsEditorSession = {
  csrf: string;
  expires: number;
  sessionId: string;
};

export function getNewsEditorKey(): string | null {
  const key = process.env.NEWS_EDITOR_KEY;
  return key && key.length >= MINIMUM_KEY_LENGTH ? key : null;
}

export function createNewsEditorSession() {
  const key = getNewsEditorKey();
  if (!key) throw new Error("NEWS_EDITOR_KEY must contain at least 32 characters.");
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const csrf = crypto.randomBytes(32).toString("base64url");
  const sessionId = crypto.randomUUID();
  const payload = Buffer.from(JSON.stringify({ csrf, expires, sessionId }), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", key).update(payload).digest("base64url");
  return { session: `${payload}.${signature}`, csrf };
}

export async function getNewsEditorSessionFromToken(token?: string): Promise<NewsEditorSession | null> {
  const key = getNewsEditorKey();
  if (!key || !token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = crypto.createHmac("sha256", key).update(payload).digest("base64url");
  if (!timingSafeNewsEditorKeyEqual(signature, expected)) return null;
  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { csrf?: unknown; expires?: unknown; sessionId?: unknown };
    if (
      typeof value.csrf !== "string"
      || typeof value.expires !== "number"
      || typeof value.sessionId !== "string"
      || value.expires < Math.floor(Date.now() / 1000)
    ) return null;
    // Signed and unexpired is not enough: a signed-out token must stop working.
    // Mirrors the admin check, and costs the same one lookup per request.
    const db = getSupabaseAdminServer();
    if (!db) return null;
    const { data, error } = await db
      .from("admin_session_revocations")
      .select("session_id")
      .eq("session_id", value.sessionId)
      .maybeSingle();
    if (error) {
      console.error("News editor session revocation lookup failed:", error.message);
      return null;
    }
    if (data) return null;
    return { csrf: value.csrf, expires: value.expires * 1000, sessionId: value.sessionId };
  } catch {
    return null;
  }
}

/** Marks the request's session revoked so its token stops working before it expires. */
export async function revokeNewsEditorSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return true;
  const key = getNewsEditorKey();
  if (!key) {
    console.error("News editor session could not be revoked because NEWS_EDITOR_KEY is unavailable.");
    return false;
  }
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return true;
  const expected = crypto.createHmac("sha256", key).update(payload).digest("base64url");
  if (!timingSafeNewsEditorKeyEqual(signature, expected)) return true;
  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sessionId?: unknown; expires?: unknown };
    if (typeof value.sessionId !== "string" || typeof value.expires !== "number") return true;
    const db = getSupabaseAdminServer();
    if (!db) {
      console.error("News editor session could not be revoked because database access is unavailable.");
      return false;
    }
    const { error } = await db
      .from("admin_session_revocations")
      .upsert(
        { session_id: value.sessionId, expires_at: new Date(value.expires * 1000).toISOString() },
        { onConflict: "session_id" },
      );
    if (error) {
      console.error("News editor session revocation failed:", error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error("News editor session revocation failed unexpectedly:", error);
    return false;
  }
}

export function isValidNewsEditorKey(supplied: string): boolean {
  const expected = getNewsEditorKey();
  return Boolean(expected && supplied && timingSafeNewsEditorKeyEqual(expected, supplied));
}

export function getNewsEditorSession(request: NextRequest) {
  return getNewsEditorSessionFromToken(request.cookies.get(SESSION_COOKIE)?.value);
}

export async function isNewsEditorRequest(request: NextRequest, mutation = false) {
  if (!isTrustedOrigin(request)) return false;
  const session = await getNewsEditorSession(request);
  if (!session) return false;
  if (
    mutation
    && (
      request.headers.get("x-news-csrf-token") !== session.csrf
      || request.cookies.get(CSRF_COOKIE)?.value !== session.csrf
    )
  ) return false;
  return true;
}

export const newsEditorCookieNames = {
  session: SESSION_COOKIE,
  csrf: CSRF_COOKIE,
};

export const newsEditorCookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: SESSION_SECONDS,
  path: "/",
};
