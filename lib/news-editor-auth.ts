import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { isTrustedOrigin } from "@/lib/admin";

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
  const payload = Buffer.from(JSON.stringify({ csrf, expires }), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", key).update(payload).digest("base64url");
  return { session: `${payload}.${signature}`, csrf };
}

export function getNewsEditorSessionFromToken(token?: string): NewsEditorSession | null {
  const key = getNewsEditorKey();
  if (!key || !token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = crypto.createHmac("sha256", key).update(payload).digest("base64url");
  if (!timingSafeNewsEditorKeyEqual(signature, expected)) return null;
  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { csrf?: unknown; expires?: unknown };
    if (
      typeof value.csrf !== "string"
      || typeof value.expires !== "number"
      || value.expires < Math.floor(Date.now() / 1000)
    ) return null;
    return { csrf: value.csrf, expires: value.expires * 1000 };
  } catch {
    return null;
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
  const session = getNewsEditorSession(request);
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
