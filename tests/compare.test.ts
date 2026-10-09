import { describe, expect, it } from "vitest";

import { getComparisonFit, normalizeCompareSlugs, toggleCompareSlug } from "@/lib/compare";
import type { Agent } from "@/lib/types";

function comparisonAgent(name: string, requiresApiKey: boolean | null): Agent {
  return {
    id: name,
    name,
    slug: name.toLowerCase(),
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
    requires_api_key: requiresApiKey,
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
  };
}

describe("compare selection", () => {
  it("removes invalid and duplicate slugs while keeping three", () => {
    expect(normalizeCompareSlugs(["one", "one", "../bad", "two", "three", "four"])).toEqual(["one", "two", "three"]);
  });

  it("toggles a slug without exceeding the selection limit", () => {
    expect(toggleCompareSlug(["one", "two", "three"], "four")).toEqual(["one", "two", "three"]);
    expect(toggleCompareSlug(["one", "two"], "one")).toEqual(["two"]);
  });

  it("does not treat an undocumented API-key requirement as no-key", () => {
    const unknown = comparisonAgent("Unknown", null);
    const local = comparisonAgent("Local", false);

    expect(getComparisonFit([unknown])?.reasons).not.toContain("no API key listed for the documented setup");
    expect(getComparisonFit([unknown, local])?.label).toBe("Local");
  });

  it("does not reward a missing hardware requirement", () => {
    const undocumented = comparisonAgent("Zulu undocumented", false);
    const documented = {
      ...comparisonAgent("Alpha documented", true),
      hardware_requirements: "4 GB RAM",
      os_commands: { linux: ["install"] },
    };

    expect(getComparisonFit([undocumented, documented])?.label).toBe("Alpha documented");
    expect(getComparisonFit([undocumented])?.reasons).not.toContain("no hardware requirement listed");
  });
});
