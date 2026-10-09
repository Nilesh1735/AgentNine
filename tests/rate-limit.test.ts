import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { allowRequest, checkRequestRateLimit } from "@/lib/rate-limit";

describe("allowRequest", () => {
  it("allows up to the configured limit and rejects subsequent requests", () => {
    const key = `test-${crypto.randomUUID()}`;

    expect(allowRequest(key, 2, 60_000)).toBe(true);
    expect(allowRequest(key, 2, 60_000)).toBe(true);
    expect(allowRequest(key, 2, 60_000)).toBe(false);
  });

  describe("checkRequestRateLimit", () => {
    const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
    const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    beforeEach(() => {
      vi.stubEnv("NODE_ENV", "production");
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      vi.stubGlobal("fetch", vi.fn());
      vi.spyOn(console, "error").mockImplementation(() => undefined);
    });

    afterEach(() => {
      if (originalUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
      else process.env.UPSTASH_REDIS_REST_URL = originalUrl;
      if (originalToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
      else process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
      vi.unstubAllEnvs();
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    });

    it("fails closed in production when the shared limiter is not configured", async () => {
      await expect(checkRequestRateLimit("test", 2, 60_000)).resolves.toEqual({ status: "unavailable" });
      expect(fetch).not.toHaveBeenCalled();
    });

    it("uses atomic shared increments with a hashed key", async () => {
      process.env.UPSTASH_REDIS_REST_URL = "https://rate-limit.example";
      process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
      vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify([{ result: [1, 15_000] }]), { status: 200 }));

      await expect(checkRequestRateLimit("admin-login:192.0.2.1", 5, 15_000)).resolves.toEqual({
        status: "allowed",
        limit: 5,
        remaining: 4,
        resetAfterSeconds: 15,
      });
      const [url, init] = vi.mocked(fetch).mock.calls[0];
      expect(url).toBe("https://rate-limit.example/pipeline");
      expect(new Headers(init?.headers).get("authorization")).toBe("Bearer test-token");
      const command = JSON.parse(String(init?.body))[0];
      expect(command[0]).toBe("EVAL");
      expect(command[3]).not.toContain("192.0.2.1");
      expect(command[4]).toBe("15000");
    });

    it("reports a reached limit from the shared counter", async () => {
      process.env.UPSTASH_REDIS_REST_URL = "https://rate-limit.example";
      process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
      vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify([{ result: [6, 31_000] }]), { status: 200 }));

      await expect(checkRequestRateLimit("test", 5, 60_000)).resolves.toEqual({
        status: "limited",
        limit: 5,
        remaining: 0,
        resetAfterSeconds: 31,
      });
    });

    it("fails closed when the shared limiter is unreachable", async () => {
      process.env.UPSTASH_REDIS_REST_URL = "https://rate-limit.example";
      process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
      vi.mocked(fetch).mockRejectedValueOnce(new Error("offline"));

      await expect(checkRequestRateLimit("test", 5, 60_000)).resolves.toEqual({ status: "unavailable" });
    });
  });

  it("starts a new window after the previous one expires", async () => {
    const key = `test-${crypto.randomUUID()}`;

    expect(allowRequest(key, 1, 100)).toBe(true);
    expect(allowRequest(key, 1, 100)).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 120));
    expect(allowRequest(key, 1, 100)).toBe(true);
  });
});
