import { afterEach, describe, expect, it, vi } from "vitest";
import type { getSupabasePublicServer } from "@/lib/supabase";

vi.mock("next/cache", () => ({
  unstable_cache: (callback: (...args: never[]) => unknown) => callback,
}));

vi.mock("@/lib/supabase", () => ({
  getSupabasePublicServer: vi.fn(),
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

function createSupabaseLookup(data: unknown, error: { message: string } | null) {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
  };
  return {
    client: { from: vi.fn(() => query) } as unknown as NonNullable<ReturnType<typeof getSupabasePublicServer>>,
    query,
  };
}

describe("catalog detail lookups", () => {
  it("rejects agent database errors instead of reporting a missing agent", async () => {
    const { getSupabasePublicServer } = await import("@/lib/supabase");
    const { client } = createSupabaseLookup(null, { message: "database unavailable" });
    vi.mocked(getSupabasePublicServer).mockReturnValue(client);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { getAgent } = await import("@/lib/data");
    await expect(getAgent("example-agent")).rejects.toThrow("database unavailable");
  });

  it("rejects category database errors instead of reporting a missing category", async () => {
    const { getSupabasePublicServer } = await import("@/lib/supabase");
    const { client } = createSupabaseLookup(null, { message: "database unavailable" });
    vi.mocked(getSupabasePublicServer).mockReturnValue(client);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { getCategory } = await import("@/lib/data");
    await expect(getCategory("example-category")).rejects.toThrow("database unavailable");
  });

  it("still returns undefined when the database confirms a record is absent", async () => {
    const { getSupabasePublicServer } = await import("@/lib/supabase");
    const { client } = createSupabaseLookup(null, null);
    vi.mocked(getSupabasePublicServer).mockReturnValue(client);

    const { getAgent, getCategory } = await import("@/lib/data");
    await expect(getAgent("missing-agent")).resolves.toBeUndefined();
    await expect(getCategory("missing-category")).resolves.toBeUndefined();
  });
});
