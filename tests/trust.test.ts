import { describe, expect, it } from "vitest";

import { getAgentTrustState } from "@/lib/trust";
import type { Agent } from "@/lib/types";

const verifiedAgent: Agent = {
  id: "verified",
  name: "Verified agent",
  slug: "verified-agent",
  short_description: "",
  category_id: "",
  tags: [],
  github_url: null,
  version_tag: "",
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
  last_verified_date: "2026-10-01",
  stars: 0,
  last_commit_at: "",
  is_archived: false,
  setup_steps: [],
  setup_guide: {},
  verification_score: 5,
  revision: 1,
  verified_operating_systems: [],
  verified_install_command: "",
  verified_first_task: "",
  verification_failure_conditions: "",
  verification_notes: "",
  upstream_changed_since_verification: false,
};

describe("agent trust state", () => {
  it("marks a fully verified agent as needing review when repository metadata is stale", () => {
    const agent = {
      ...verifiedAgent,
      metadata_last_checked_at: "2026-04-01T00:00:00.000Z",
    };

    expect(getAgentTrustState(agent, new Date("2026-10-05T00:00:00.000Z").getTime()).key).toBe("stale");
  });

  it("keeps a fully verified agent verified when its freshness signal is current", () => {
    const agent = {
      ...verifiedAgent,
      metadata_last_checked_at: "2026-10-01T00:00:00.000Z",
    };

    expect(getAgentTrustState(agent, new Date("2026-10-05T00:00:00.000Z").getTime()).key).toBe("verified");
  });
});
