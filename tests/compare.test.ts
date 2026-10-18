import { describe, expect, it } from "vitest";
import { getSetupCommandPlatforms, hasSetupCommands, normalizeCompareSlugs, toggleCompareSlug } from "../lib/compare";

describe("comparison setup command signal", () => {
  it("does not treat empty platform command arrays as available commands", () => {
    const agent = {
      os_commands: { linux: [], macos: [], windows: [] },
      setup_guide: { platforms: {} },
    };
    expect(hasSetupCommands(agent)).toBe(false);
    expect(getSetupCommandPlatforms(agent)).toEqual([]);
  });

  it("recognizes commands on any supported platform", () => {
    const agent = {
      os_commands: { linux: [], macos: ["brew install example"], windows: [] },
      setup_guide: { platforms: {} },
    };
    expect(hasSetupCommands(agent)).toBe(true);
    expect(getSetupCommandPlatforms(agent)).toEqual(["macos"]);
  });

  it("recognizes install and first-run commands in the setup guide", () => {
    const agent = {
      os_commands: { linux: [], macos: [], windows: [] },
      setup_guide: {
        platforms: {
          windows: { support: "supported" as const, install_commands: ["winget install example"] },
          macos: { support: "supported" as const, first_run_commands: ["example --help"] },
          linux: { support: "supported" as const, install_commands: ["  "] },
        },
      },
    };
    expect(hasSetupCommands(agent)).toBe(true);
    expect(getSetupCommandPlatforms(agent)).toEqual(["windows", "macos"]);
  });

  it("does not report commands for an explicitly unsupported operating system", () => {
    const agent = {
      os_commands: { linux: [], macos: [], windows: ["install example"] },
      setup_guide: {
        platforms: {
          windows: { support: "unsupported" as const },
        },
      },
    };
    expect(getSetupCommandPlatforms(agent)).toEqual([]);
  });
});

describe("comparison selection", () => {
  it("removes invalid and duplicate slugs and caps the selection at three", () => {
    expect(normalizeCompareSlugs(["agent-one", "agent-one", "Invalid", "agent-two", "agent-three", "agent-four"]))
      .toEqual(["agent-one", "agent-two", "agent-three"]);
  });

  it("removes a selected agent while preserving the remaining order", () => {
    expect(toggleCompareSlug(["agent-one", "agent-two", "agent-three"], "agent-two"))
      .toEqual(["agent-one", "agent-three"]);
  });

  it("does not add a fourth selected agent", () => {
    const selected = ["agent-one", "agent-two", "agent-three"];
    expect(toggleCompareSlug(selected, "agent-four")).toEqual(selected);
  });
});
