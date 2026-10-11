import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSupabaseAdminServer } from "../lib/supabase";

const supabaseEnvironmentNames = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_KEY",
] as const;

describe("Supabase admin configuration", () => {
  beforeEach(() => {
    for (const name of supabaseEnvironmentNames) vi.stubEnv(name, "");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it.each([
    ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    ["SUPABASE_URL", "SUPABASE_SECRET_KEY"],
    ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_KEY"],
  ])("creates a server client from %s and %s", (urlName, keyName) => {
    vi.stubEnv(urlName, "https://example.supabase.co");
    vi.stubEnv(keyName, "server-only-test-key");

    expect(getSupabaseAdminServer()).not.toBeNull();
  });

  it("does not use a public anonymous key as an admin credential", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-test-key");
    vi.stubEnv("SUPABASE_ANON_KEY", "public-test-key");

    expect(getSupabaseAdminServer()).toBeNull();
    expect(log).toHaveBeenCalledWith(
      "[Supabase] Admin client is unavailable; configure SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SECRET_KEY, or SUPABASE_SERVICE_KEY.",
    );
  });
});
