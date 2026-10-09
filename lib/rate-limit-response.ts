import { NextResponse } from "next/server";
import type { RateLimitResult } from "@/lib/rate-limit";

export function rateLimitResponse(result: RateLimitResult, limitedMessage: string) {
  if (result.status === "allowed") return null;
  const limited = result.status === "limited";
  const headers = limited
    ? {
        "RateLimit-Limit": String(result.limit),
        "RateLimit-Remaining": String(result.remaining),
        "RateLimit-Reset": String(result.resetAfterSeconds),
        "Retry-After": String(result.resetAfterSeconds),
      }
    : undefined;
  return NextResponse.json(
    {
      error: limited ? limitedMessage : "Request protection is temporarily unavailable. Try again shortly.",
      code: limited ? "rate_limited" : "rate_limit_unavailable",
    },
    { status: limited ? 429 : 503, headers },
  );
}
