import { afterEach, describe, expect, it, vi } from "vitest";

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
