import { describe, expect, it } from "vitest";
import { getSetupCommandPlatforms, hasSetupCommands } from "../lib/compare";

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
});
