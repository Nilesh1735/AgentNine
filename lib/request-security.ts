import { isIP } from "node:net";

export type JsonBodyResult<T> =
  | { ok: true; value: T }
  | { ok: false; status: 400 | 413; error: "Invalid request" | "Request too large" };

export function getClientIp(request: Request): string {
  const requestIp = (request as Request & { ip?: string }).ip;
  if (requestIp && isIP(requestIp)) return requestIp;



  if (process.env.TRUSTED_PROXY_HEADERS === "true") {
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (forwarded && isIP(forwarded)) return forwarded;
    const realIp = request.headers.get("x-real-ip")?.trim();
    if (realIp && isIP(realIp)) return realIp;
  }

  return "unknown";
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
