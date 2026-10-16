import { describe, expect, it } from "vitest";
import { validateAdminAgentScalars } from "../lib/admin-agent-validation";

describe("admin agent scalar validation", () => {
  it("accepts unassigned categories and documented nullable API-key state", () => {
    expect(() => validateAdminAgentScalars({
      category_id: "",
      requires_api_key: null,
      is_flagship: false,
      is_archived: false,
      last_verified_date: "Not verified",
    })).not.toThrow();
  });

  it("rejects malformed category IDs and scalar types", () => {
    expect(() => validateAdminAgentScalars({ category_id: "coding" })).toThrow("Invalid category");
    expect(() => validateAdminAgentScalars({ requires_api_key: "false" })).toThrow("Invalid API key requirement");
    expect(() => validateAdminAgentScalars({ is_flagship: 1 })).toThrow("Invalid flagship state");
  });

  it("rejects negative, fractional, and out-of-range star counts", () => {
    expect(() => validateAdminAgentScalars({ stars: -1 })).toThrow("Invalid star count");
    expect(() => validateAdminAgentScalars({ stars: 1.5 })).toThrow("Invalid star count");
    expect(() => validateAdminAgentScalars({ stars: 2_147_483_648 })).toThrow("Invalid star count");
  });

  it("accepts existing date sentinels and rejects malformed dates", () => {
    expect(() => validateAdminAgentScalars({ last_verified_date: "Not verified" })).not.toThrow();
    expect(() => validateAdminAgentScalars({ last_verified_date: "2026-02-30" })).toThrow("Invalid setup review date");
    expect(() => validateAdminAgentScalars({ last_commit_at: "not-a-date" })).toThrow("Invalid repository commit date");
  });

  it("limits editable text, tags, and command platform keys", () => {
    expect(() => validateAdminAgentScalars({ short_description: "x".repeat(1001) })).toThrow("Invalid short_description");
    expect(() => validateAdminAgentScalars({ tags: Array.from({ length: 51 }, () => "tag") })).toThrow("Invalid tags");
    expect(() => validateAdminAgentScalars({ os_commands: { solaris: ["run"] } })).toThrow("Invalid os_commands");
  });
});
