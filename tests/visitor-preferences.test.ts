import { afterEach, describe, expect, it, vi } from "vitest";
import { isPreferencesServiceUnavailable } from "@/lib/visitor-preferences";

describe("visitor preference updates", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("serializes writes and preserves progress saved by overlapping setup steppers", async () => {
    let serverPreferences: Record<string, unknown> = { setupProgress: {} };
    const patches: Record<string, unknown>[] = [];
    vi.stubGlobal("document", { documentElement: { dataset: {} } });
    vi.stubGlobal("fetch", vi.fn(async (_input: RequestInfo | URL, options?: RequestInit) => {
      if (options?.method === "PATCH") {
        const patch = JSON.parse(String(options.body)) as Record<string, unknown>;
        patches.push(patch);
        serverPreferences = { ...serverPreferences, ...patch };
      }
      return new Response(JSON.stringify({ preferences: serverPreferences }), { status: 200 });
    }));

    const { updateVisitorPreferences } = await import("@/lib/visitor-preferences");
    await Promise.all([
      updateVisitorPreferences({ setupProgress: { "agentnine:setup:first": 1 } }),
      updateVisitorPreferences({ setupProgress: { "agentnine:setup:second": 2 } }),
    ]);

    expect(patches).toEqual([
      { setupProgress: { "agentnine:setup:first": 1 } },
      { setupProgress: { "agentnine:setup:first": 1, "agentnine:setup:second": 2 } },
    ]);
  });
});

describe("visitor preference service errors", () => {
  it("recognizes unavailable load and save responses", () => {
    expect(isPreferencesServiceUnavailable(new Error("Preferences could not be loaded (503)"))).toBe(true);
    expect(isPreferencesServiceUnavailable(new Error("Preferences could not be saved (503)"))).toBe(true);
  });

  it("does not classify unrelated errors as service outages", () => {
    expect(isPreferencesServiceUnavailable(new Error("Preferences could not be loaded (500)"))).toBe(false);
    expect(isPreferencesServiceUnavailable(new TypeError("Network request failed"))).toBe(false);
  });
});
