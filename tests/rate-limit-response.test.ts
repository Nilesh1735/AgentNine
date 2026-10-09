import { describe, expect, it } from "vitest";

import { rateLimitResponse } from "@/lib/rate-limit-response";

describe("rateLimitResponse", () => {
  it("provides retry and quota headers when a request is limited", async () => {
    const response = rateLimitResponse({
      status: "limited",
      limit: 5,
      remaining: 0,
      resetAfterSeconds: 12,
    }, "Try again later.");

    expect(response?.status).toBe(429);
    expect(response?.headers.get("retry-after")).toBe("12");
    expect(response?.headers.get("ratelimit-limit")).toBe("5");
    expect(response?.headers.get("ratelimit-remaining")).toBe("0");
    expect(response?.headers.get("ratelimit-reset")).toBe("12");
    await expect(response?.json()).resolves.toEqual({
      error: "Try again later.",
      code: "rate_limited",
    });
  });

  it("does not add retry headers when the shared limiter is unavailable", () => {
    const response = rateLimitResponse({ status: "unavailable" }, "Try again later.");

    expect(response?.status).toBe(503);
    expect(response?.headers.has("retry-after")).toBe(false);
  });
});
