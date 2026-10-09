import { NextResponse } from "next/server";
import { getSupabaseAdminServer, getSupabasePublicServer } from "@/lib/supabase";
import { checkRequestRateLimit } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/rate-limit-response";
import { getClientIp } from "@/lib/request-security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return NextResponse.json({ error: "JSON is required." }, { status: 415 });
  const client = getClientIp(request);
  const contentLength = request.headers.get("content-length");
  if (contentLength && /^\d+$/.test(contentLength) && Number(contentLength) > 1_024) {
    return NextResponse.json({ error: "Request too large", code: "request_too_large" }, { status: 413 });
  }
  const limitResponse = rateLimitResponse(
    await checkRequestRateLimit(`account-delete:${client}`, 3, 60 * 60_000),
    "Too many deletion attempts.",
  );
  if (limitResponse) return limitResponse;
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return NextResponse.json({ error: "Sign in to request account deletion." }, { status: 401 });
  const token = authorization.slice("Bearer ".length);
  const publicClient = getSupabasePublicServer();
  const adminClient = getSupabaseAdminServer();
  if (!publicClient || !adminClient) return NextResponse.json({ error: "Account deletion is not configured." }, { status: 503 });
  const { data: userData, error: userError } = await publicClient.auth.getUser(token);
  if (userError || !userData.user) return NextResponse.json({ error: "Your session is invalid or expired." }, { status: 401 });
  const userId = userData.user.id;
  const { error: contributionError } = await adminClient.rpc("delete_account_contribution_data", {
    p_user_id: userId,
    p_email: userData.user.email ?? null,
  });
  if (contributionError) {
    console.error("Account contribution deletion failed:", contributionError.message);
    return NextResponse.json({ error: "Account data could not be fully removed. The account remains active; try again later." }, { status: 503 });
  }
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
  if (deleteError) return NextResponse.json({ error: "Could not delete the account." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
