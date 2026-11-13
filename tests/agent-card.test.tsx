import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Agent } from "../lib/types";

vi.mock("../components/CompareButton", () => ({
  CompareButton: () => <button type="button">Compare</button>,
}));

import { AgentCard } from "../components/AgentCard";

const agent: Agent = {
  id: "agent-1",
  name: "Agent One",
  slug: "agent-one",
  short_description: "A test agent.",
  category_id: "category-1",
  tags: [],
  github_url: "https://github.com/example/agent-one",
  version_tag: "v1.0.0",
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
  upstream_changed_since_verification: false,
  verified_operating_systems: [],
  verified_install_command: "",
  verified_first_task: "",
  verification_failure_conditions: "",
  verification_notes: "",
};

describe("AgentCard links", () => {
  it("names the guide link after the agent while preserving its visible label", () => {
    const markup = renderToStaticMarkup(<AgentCard agent={agent} />);

    expect(markup).toMatch(/aria-label="View Agent One guide"[^>]*>View guide/);
  });
});
