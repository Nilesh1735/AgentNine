import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getClientIp, getRateLimitSubject } from "@/lib/request-security";

function requestWith(headers: Record<string, string>) {
  return new Request("https://agentnine.pro/api/contact", { headers });
}

const originalVercel = process.env.VERCEL;
const originalTrusted = process.env.TRUSTED_PROXY_HEADERS;

describe("getClientIp", () => {
  beforeEach(() => {
    process.env.VERCEL = "1";
    delete process.env.TRUSTED_PROXY_HEADERS;
  });

  afterEach(() => {
    if (originalVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = originalVercel;
    if (originalTrusted === undefined) delete process.env.TRUSTED_PROXY_HEADERS;
    else process.env.TRUSTED_PROXY_HEADERS = originalTrusted;
  });

  it("prefers x-vercel-forwarded-for over x-forwarded-for", () => {
    const ip = getClientIp(requestWith({
      "x-vercel-forwarded-for": "203.0.113.5",
      "x-forwarded-for": "198.51.100.9",
    }));
    expect(ip).toBe("203.0.113.5");
  });

  it("takes only the first entry of a forwarded chain", () => {
    expect(getClientIp(requestWith({ "x-forwarded-for": "203.0.113.5, 198.51.100.9" }))).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip", () => {
    expect(getClientIp(requestWith({ "x-real-ip": "203.0.113.7" }))).toBe("203.0.113.7");
  });

  it("accepts IPv6", () => {
    expect(getClientIp(requestWith({ "x-vercel-forwarded-for": "2001:db8::1" }))).toBe("2001:db8::1");
  });

  it.each(["not-an-ip", "", "<script>alert(1)</script>", "999.999.999.999"])(
    "rejects the malformed value %j",
    (value) => {
      expect(getClientIp(requestWith({ "x-forwarded-for": value }))).toBeNull();
    },
  );

  it("returns null when no forwarded header is present", () => {
    expect(getClientIp(requestWith({}))).toBeNull();
  });

  it("ignores forwarded headers off-Vercel unless the operator opts in", () => {
    delete process.env.VERCEL;
    expect(getClientIp(requestWith({ "x-forwarded-for": "203.0.113.5" }))).toBeNull();
    process.env.TRUSTED_PROXY_HEADERS = "true";
    expect(getClientIp(requestWith({ "x-forwarded-for": "203.0.113.5" }))).toBe("203.0.113.5");
  });
});

describe("getRateLimitSubject", () => {
  beforeEach(() => {
    process.env.VERCEL = "1";
  });

  afterEach(() => {
    if (originalVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = originalVercel;
  });

  it("uses the resolved IP when there is one", () => {
    const request = requestWith({ "x-vercel-forwarded-for": "203.0.113.5" });
    expect(getRateLimitSubject(request, "isolate")).toBe("203.0.113.5");
    expect(getRateLimitSubject(request, "share")).toBe("203.0.113.5");
  });

  it("isolates unresolved clients so one bucket cannot throttle everyone", () => {
    const first = getRateLimitSubject(requestWith({}), "isolate");
    const second = getRateLimitSubject(requestWith({}), "isolate");
    expect(first).not.toBe(second);
  });

  it("shares one bucket for unresolved clients on credential endpoints", () => {
    const first = getRateLimitSubject(requestWith({}), "share");
    const second = getRateLimitSubject(requestWith({}), "share");
    expect(first).toBe(second);
  });

  it("never returns the literal placeholder that previously collapsed every bucket", () => {
    expect(getRateLimitSubject(requestWith({}), "isolate")).not.toBe("unknown");
    expect(getRateLimitSubject(requestWith({}), "share")).not.toBe("unknown");
  });
});

describe("account deletion keeps an isolated bucket", () => {
  // Sharing one bucket on an unresolved IP would let strangers exhaust the 3/hour
  // allowance and block a privacy right site-wide. Deletion is already gated on a
  // verified bearer token, so the limit is defence-in-depth, not the primary control.
  it("isolates unresolved clients instead of sharing one allowance", () => {
    const a = getRateLimitSubject(requestWith({}), "isolate");
    const b = getRateLimitSubject(requestWith({}), "isolate");
    expect(a).not.toBe(b);
  });
});
