import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { getSupabaseAdminServer } from "@/lib/supabase";
import { getClientIp } from "@/lib/request-security";
import { checkRequestRateLimit, type RateLimitResult } from "@/lib/rate-limit";

const SESSION_SECONDS = 60 * 60;

function getSessionSecret() {
  const secret = process.env.ADMIN_DASHBOARD_KEY;
  if (!secret) throw new Error("ADMIN_DASHBOARD_KEY is required for admin sessions");
  return secret;
}

export function isTrustedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? request.nextUrl.protocol.slice(0, -1);
  if (protocol !== "http" && protocol !== "https") return false;

  const hosts = [request.headers.get("host"), request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()]
    .filter((host): host is string => Boolean(host));
  return hosts.some((host) => {
    try {
      const expectedOrigin = new URL(`${protocol}://${host}`).origin;
      return origin === expectedOrigin;
    } catch {
      return false;
    }
  });
}

export function rateLimit(ip: string): Promise<RateLimitResult> {
  return checkRequestRateLimit(`admin-login:${ip}`, 5, 15 * 60 * 1000);
}

export { getClientIp };

export function createAdminSession() {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const csrf = crypto.randomBytes(32).toString("base64url");
  const sessionId = crypto.randomUUID();
  const payload = Buffer.from(JSON.stringify({ csrf, expires, sessionId }), "utf8").toString("base64url");
  const secret = getSessionSecret();
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return { session: `${payload}.${signature}`, csrf };
}

export async function getAdminSession(request: NextRequest) {
  return getAdminSessionFromToken(request.cookies.get("admin_session")?.value);
}

export async function getAdminSessionFromToken(token?: string) {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  let secret: string;
  try {
    secret = getSessionSecret();
  } catch {
    return null;
  }
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { csrf?: unknown; expires?: unknown; sessionId?: unknown };
    if (typeof value.csrf !== "string" || typeof value.expires !== "number" || typeof value.sessionId !== "string" || value.expires < Math.floor(Date.now() / 1000)) return null;
    const db = getSupabaseAdminServer();
    if (!db) return null;
    const { data, error } = await db.from("admin_session_revocations").select("session_id").eq("session_id", value.sessionId).maybeSingle();
    if (error) {
      console.error("Admin session revocation lookup failed:", error.message);
      return null;
    }
    if (data) return null;
    return { csrf: value.csrf, expires: value.expires * 1000, sessionId: value.sessionId };
  } catch {
    return null;
  }
}

export async function isAdminRequest(request: NextRequest, mutation = false) {
  if (!isTrustedOrigin(request)) return false;
  const session = await getAdminSession(request);
  if (!session) return false;
  if (mutation && request.headers.get("x-csrf-token") !== session.csrf) return false;
  return true;
}

export async function revokeAdminSession(request: NextRequest) {
  const token = request.cookies.get("admin_session")?.value;
  if (!token) return;
  const [payload] = token.split(".");
  if (!payload) return;
  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sessionId?: unknown; expires?: unknown };
    if (typeof value.sessionId !== "string" || typeof value.expires !== "number") return;
    const db = getSupabaseAdminServer();
    if (db) {
      const { error } = await db.from("admin_session_revocations").upsert({ session_id: value.sessionId, expires_at: new Date(value.expires * 1000).toISOString() }, { onConflict: "session_id" });
      if (error) console.error("Admin session revocation failed:", error.message);
    }
  } catch {
    return;
  }
}

export const adminCookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: SESSION_SECONDS,
  path: "/",
};
