import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminCookieOptions, createAdminSession, isTrustedOrigin, rateLimit, revokeAdminSession } from "@/lib/admin";
import { getSupabaseAdminServer } from "@/lib/supabase";
import { getClientIp, jsonBodyError, readJsonBody } from "@/lib/request-security";
import { rateLimitResponse } from "@/lib/rate-limit-response";

async function auditLogin(success: boolean, request: NextRequest) {
  const db = getSupabaseAdminServer();
  if (db) await db.from("admin_login_log").insert({ success, ip_address: getClientIp(request) });
}

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const ip = getClientIp(request);
  const limitResponse = rateLimitResponse(await rateLimit(ip), "Too many attempts. Try again later.");
  if (limitResponse) return limitResponse;
  const parsed = await readJsonBody<unknown>(request, 2_048);
  if (!parsed.ok) return NextResponse.json(jsonBodyError(parsed), { status: parsed.status });
  const body = parsed.value;
  const supplied = body && typeof body === "object" && typeof (body as Record<string, unknown>).key === "string" ? (body as Record<string, string>).key : "";
  const expected = process.env.ADMIN_DASHBOARD_KEY ?? "";
  const valid = Boolean(expected && supplied && expected.length === supplied.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(supplied)));
  await auditLogin(valid, request);
  if (!valid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let session: string;
  let csrf: string;
  try {
    ({ session, csrf } = createAdminSession());
  } catch (error) {
    console.error("Admin session configuration is invalid:", error);
    return NextResponse.json({ error: "Admin authentication is unavailable" }, { status: 503 });
  }
  const response = NextResponse.json({ ok: true, csrf });
  response.cookies.set("admin_session", session, adminCookieOptions);
  response.cookies.set("admin_csrf", csrf, { httpOnly: false, sameSite: "strict", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60, path: "/" });
  return response;
}

export async function DELETE(request: NextRequest) {
  if (!isTrustedOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  await revokeAdminSession(request);
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("admin_session");
  response.cookies.delete("admin_csrf");
  return response;
}
