import { describe, expect, it } from "vitest";
import { normalizeSetupGuide, validateSetupGuide } from "../lib/setup-guide";

const phasedGuide = {
  source_url: "https://github.com/example/agent",
  checked_at: "2026-10-26",
  platforms: {
    windows: {
      support: "supported",
      terminal_note: "Keep commands in the same terminal.",
      install_commands: ["git clone example", "cd example", "uv sync"],
      command_phases: [
        { title: "Prepare", commands: ["git clone example", "cd example"] },
        { title: "Install", commands: ["uv sync"] },
        { title: "Configure", commands: [], note: "Edit the environment file." },
      ],
    },
  },
};

describe("setup command phases", () => {
  it("accepts phases that preserve the source-checked command sequence", () => {
    expect(validateSetupGuide(phasedGuide)).toBe(true);
    expect(normalizeSetupGuide(phasedGuide).platforms?.windows?.command_phases).toEqual(phasedGuide.platforms.windows.command_phases);
  });

  it("rejects phases that omit, reorder, or alter a recorded install command", () => {
    const guide = structuredClone(phasedGuide);
    guide.platforms.windows.command_phases[1].commands = ["uv sync --different"];

    expect(validateSetupGuide(guide)).toBe(false);
    expect(normalizeSetupGuide(guide).platforms?.windows?.command_phases).toBeUndefined();
  });

  it("requires a note when a phase contains no commands", () => {
    const guide = structuredClone(phasedGuide);
    guide.platforms.windows.command_phases[2].note = "   ";

    expect(validateSetupGuide(guide)).toBe(false);
  });
});
