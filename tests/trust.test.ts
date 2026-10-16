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
    verified_operating_systems: [],
    verified_install_command: "",
    verified_first_task: "",
    verification_failure_conditions: "",
    verification_notes: "",
    upstream_changed_since_verification: false,
    ...overrides,
  };
}

describe("agent trust state freshness", () => {
  const now = Date.parse("2026-10-12T12:00:00.000Z");

  it("does not label a fully checked agent Verified when repository freshness is unknown", () => {
    const state = getAgentTrustState(createAgent({ verification_score: 5 }), now);

    expect(state.key).toBe("freshness-unknown");
    expect(state.label).toBe("Freshness unknown");
    expect(state.className).toContain("trust-state-unknown");
  });

  it("labels a fully checked agent Verified when metadata freshness is current", () => {
    const state = getAgentTrustState(createAgent({
      verification_score: 5,
      metadata_last_checked_at: "2026-10-01T12:00:00.000Z",
    }), now);

    expect(state.key).toBe("verified");
    expect(state.label).toBe("Verified");
  });

  it("keeps changed upstream as the stronger signal when freshness is unknown", () => {
    const state = getAgentTrustState(createAgent({
      verification_score: 5,
      upstream_changed_since_verification: true,
    }), now);

    expect(state.key).toBe("changed");
    expect(state.label).toBe("Changed upstream");
  });
});
