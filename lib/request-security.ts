import { isIP } from "node:net";
import { randomUUID } from "node:crypto";

export type JsonBodyResult<T> =
  | { ok: true; value: T }
  | { ok: false; status: 400 | 413; error: "Invalid request" | "Request too large" };

/**
 * Headers consulted for the client address, in order of trustworthiness.
 *
 * On Vercel the edge network overwrites `x-forwarded-for` and `x-real-ip` and does not
 * forward externally supplied values, specifically to prevent IP spoofing, so a client
 * cannot dictate them. `x-vercel-forwarded-for` is preferred because a proxy placed in
 * front of Vercel can overwrite `x-forwarded-for` but not the Vercel-specific header.
 *
 * Off-Vercel none of these are trustworthy by default, so they are read only when the
 * operator opts in with TRUSTED_PROXY_HEADERS=true.
 */
const FORWARDED_IP_HEADERS = [
  "x-vercel-forwarded-for",
  "x-forwarded-for",
  "x-real-ip",
] as const;

function readForwardedIp(request: Request, header: string): string | null {
  const raw = request.headers.get(header);
  if (!raw) return null;
  const candidate = raw.split(",")[0]?.trim();
  return candidate && isIP(candidate) ? candidate : null;
}

function forwardedHeadersAreTrusted(): boolean {
  return process.env.VERCEL === "1" || process.env.TRUSTED_PROXY_HEADERS === "true";
}

let hasLoggedUnresolvedClientIp = false;

/**
 * The client's IP address, or null when it cannot be established.
 *
 * Returns null rather than a placeholder so callers must decide what an unknown client
 * means for them. Never interpolate the result straight into a rate-limit key: use
 * getRateLimitSubject, which keeps unknown clients out of a single shared bucket.
 */
export function getClientIp(request: Request): string | null {
  if (!forwardedHeadersAreTrusted()) return null;
  for (const header of FORWARDED_IP_HEADERS) {
    const ip = readForwardedIp(request, header);
    if (ip) return ip;
  }
  if (!hasLoggedUnresolvedClientIp) {
    console.error(
      "[request-security] Client IP could not be resolved from forwarded headers. "
      + "On Vercel this is unexpected; off-Vercel set TRUSTED_PROXY_HEADERS=true when behind a trusted proxy.",
    );
    hasLoggedUnresolvedClientIp = true;
  }
  return null;
}

/**
 * The subject used to build a rate-limit key.
 *
 * When the IP is unknown the caller chooses the failure mode, because the safe answer
 * differs by endpoint:
 *
 * - "isolate" gives each request its own bucket, so an unresolved IP relaxes the limit
 *   instead of throttling every visitor at once. Correct for abuse-prevention limits on
 *   public endpoints, where collapsing into one bucket is a denial of service.
 * - "share" puts every unresolved request in one bucket, keeping brute-force protection
 *   on credential endpoints at the cost of a possible shared lockout.
 */
export function getRateLimitSubject(request: Request, onUnresolved: "isolate" | "share"): string {
  const ip = getClientIp(request);
  if (ip) return ip;
  return onUnresolved === "share" ? "unresolved-client" : `unresolved-${randomUUID()}`;
}

export async function readJsonBody<T>(request: Request, maxBytes: number): Promise<JsonBodyResult<T>> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && /^\d+$/.test(contentLength) && Number(contentLength) > maxBytes) {
    return { ok: false, status: 413, error: "Request too large" };
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return { ok: false, status: 400, error: "Invalid request" };
  }
  if (Buffer.byteLength(raw, "utf8") > maxBytes) return { ok: false, status: 413, error: "Request too large" };
  try {
    return { ok: true, value: JSON.parse(raw) as T };
  } catch {
    return { ok: false, status: 400, error: "Invalid request" };
  }
}

export function jsonBodyError(result: { status: 400 | 413; error: string }) {
  return { error: result.error, code: result.status === 413 ? "request_too_large" : "invalid_request" };
}
