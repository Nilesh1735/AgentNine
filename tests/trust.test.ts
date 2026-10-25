import { describe, expect, it } from "vitest";
import { getAgentTrustState } from "../lib/trust";
import type { Agent } from "../lib/types";

function createAgent(overrides: Partial<Agent> = {}): Agent {
  return {
    id: "agent-id",
    name: "Example agent",
    slug: "example-agent",
    short_description: "",
    category_id: "coding-id",
    tags: [],
    github_url: null,
    version_tag: "1.0.0",
    os_commands: {},
    env_template: "",
    common_errors: "",
    hardware_requirements: "",
    port_mapping: "",
    memory_location: "",
    network_access: "",
    file_access: "",
    uninstall_command: "",
    first_launch_prompt: "",
    cost_to_run: "",
    requires_api_key: null,
    is_flagship: false,
    status: "published",
    last_verified_date: "Not verified",
    stars: 0,
    last_commit_at: "",
    is_archived: false,
    setup_steps: [],
    setup_guide: {},
    verification_score: 0,
    revision: 1,
    metadata_is_stale: false,
    upstream_is_archived: false,
    verified_operating_systems: [],
    verified_commit_sha: null,
    verified_install_command: "",
    verified_first_task: "",
    verification_failure_conditions: "",
    verification_notes: "",
    upstream_changed_since_verification: false,
    ...overrides,
  };
}

describe("agent trust state freshness", () => {
  const now = Date.parse("2026-10-26T12:00:00.000Z");

  it("uses Verified for the five-step checklist state", () => {
    const state = getAgentTrustState(createAgent({
      verification_score: 5,
      last_verified_date: "2026-10-25",
      setup_guide: { source_url: "https://example.com/setup", checked_at: "2026-10-25" },
    }), now);

    expect(state.key).toBe("verified");
    expect(state.label).toBe("Verified");
    expect(state.detail).toBe("All five setup verification steps are complete.");
    expect(state.detail).not.toContain("security audit");
  });

  it("does not label a partial checklist Verified even when documentation was reviewed", () => {
    const state = getAgentTrustState(createAgent({
      verification_score: 4,
      last_verified_date: "2026-10-25",
      setup_guide: { source_url: "https://example.com/setup", checked_at: "2026-10-25" },
    }), now);

    expect(state.key).toBe("unknown");
    expect(state.label).toBe("Needs review");
  });

  it("requires review when neither current documentation nor review date exists", () => {
    const state = getAgentTrustState(createAgent({ verification_score: 5 }), now);

    expect(state.key).toBe("unknown");
    expect(state.label).toBe("Needs review");
  });

  it("requires review when the project changed after the recorded verification", () => {
    const state = getAgentTrustState(createAgent({
      verification_score: 5,
      upstream_changed_since_verification: true,
    }), now);

    expect(state.key).toBe("needs-review");
    expect(state.label).toBe("Needs review");
  });

  it("requires review when setup documentation is stale", () => {
    const state = getAgentTrustState(createAgent({
      metadata_is_stale: true,
      last_verified_date: "2026-10-25",
      setup_guide: { source_url: "https://example.com/setup", checked_at: "2026-10-25" },
    }), now);

    expect(state.key).toBe("needs-review");
    expect(state.label).toBe("Needs review");
    expect(state.detail).toBe("Needs review.");
    expect(state.detail).not.toContain("metadata");
  });
});
