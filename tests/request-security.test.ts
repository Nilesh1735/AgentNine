import { afterEach, describe, expect, it } from "vitest";

import { getClientIp, readJsonBody } from "@/lib/request-security";

afterEach(() => {
  delete process.env.TRUSTED_PROXY_HEADERS;
});

describe("request security helpers", () => {
  it("does not trust forwarded client headers by default", () => {
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.10", "x-real-ip": "198.51.100.20" },
    });

    expect(getClientIp(request)).toBe("unknown");
  });

  it("accepts a validated proxy address only when explicitly enabled", () => {
    process.env.TRUSTED_PROXY_HEADERS = "true";
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.10, 10.0.0.1" },
    });

    expect(getClientIp(request)).toBe("203.0.113.10");
  });

  it("rejects oversized JSON using bytes rather than characters", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ value: "é".repeat(20) }),
    });

    const result = await readJsonBody(request, 32);
    expect(result).toEqual({ ok: false, status: 413, error: "Request too large" });
  });
});
