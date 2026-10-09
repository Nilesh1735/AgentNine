import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizeVisitorPreferences } from "@/lib/visitor-preferences";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("visitor preferences network recovery", () => {
  const stubDocument = () => {
    vi.stubGlobal("document", { documentElement: { dataset: {} } });
  };

  it("retries a transient load failure and caches the successful preferences", async () => {
    stubDocument();
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        preferences: { analyticsConsent: "declined" },
      }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { loadVisitorPreferences } = await import("@/lib/visitor-preferences");
    await expect(loadVisitorPreferences()).resolves.toEqual({ analyticsConsent: "declined" });
    await expect(loadVisitorPreferences()).resolves.toEqual({ analyticsConsent: "declined" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  describe("visitor preference key migration", () => {
    it("moves setup progress to the AgentNine key while preserving the current key value", () => {
      expect(normalizeVisitorPreferences({
        setupProgress: {
          "agenthive:setup:old-agent": 2,
          "agenthive:setup:kept-agent": 1,
          "agentnine:setup:kept-agent": 3,
        },
      })).toEqual({
        setupProgress: {
          "agentnine:setup:old-agent": 2,
          "agentnine:setup:kept-agent": 3,
        },
      });
    });
  });

  it("retries a transient save failure without issuing another initial load", async () => {
    stubDocument();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ preferences: {} }), { status: 200 }))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        preferences: { analyticsConsent: "declined" },
      }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { updateVisitorPreferences } = await import("@/lib/visitor-preferences");
    await expect(updateVisitorPreferences({ analyticsConsent: "declined" }))
      .resolves.toEqual({ analyticsConsent: "declined" });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: "PATCH" });
    expect(fetchMock.mock.calls[2][1]).toMatchObject({ method: "PATCH" });
  });

  it("leaves failed loads retryable instead of caching empty preferences", async () => {
    stubDocument();
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        preferences: { theme: "dark" },
      }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { loadVisitorPreferences } = await import("@/lib/visitor-preferences");
    await expect(loadVisitorPreferences()).rejects.toThrow("Failed to fetch");
    await expect(loadVisitorPreferences()).resolves.toEqual({ theme: "dark" });

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
