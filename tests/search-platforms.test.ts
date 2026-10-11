import { describe, expect, it } from "vitest";
import { getAgentOperatingSystems } from "../lib/search-platforms";
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

describe("search operating-system support", () => {
  it("includes explicitly supported setup-guide platforms without legacy commands", () => {
    const agent = createAgent({
      setup_guide: { platforms: { windows: { support: "supported" } } },
    });

    expect(getAgentOperatingSystems(agent)).toContain("windows");
  });

  it("keeps recognizing platforms documented with legacy OS commands", () => {
    const agent = createAgent({ os_commands: { linux: ["npm run start"] } });

    expect(getAgentOperatingSystems(agent)).toContain("linux");
  });

  it("uses verified OS labels when no explicit setup-guide status is available", () => {
    const agent = createAgent({ verified_operating_systems: ["Windows 11", "macOS 15"] });

    expect(getAgentOperatingSystems(agent)).toEqual(["windows", "macos"]);
  });

  it("does not include an explicitly unsupported platform", () => {
    const agent = createAgent({
      os_commands: { linux: ["npm run start"] },
      setup_guide: { platforms: { linux: { support: "unsupported" } } },
    });

    expect(getAgentOperatingSystems(agent)).not.toContain("linux");
  });
});
