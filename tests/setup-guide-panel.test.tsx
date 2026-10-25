import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SetupGuidePanel } from "../components/SetupGuidePanel";
import type { SetupGuide } from "../lib/types";

function renderGuide(guide: SetupGuide) {
  return renderToStaticMarkup(<SetupGuidePanel guide={guide} />);
}

function getWindowsPanelMarkup(markup: string) {
  const panel = markup.match(/<details class="setup-platform"><summary>Windows<\/summary>(.*?)<\/details>/);
  if (!panel) throw new Error("Windows setup panel was not rendered");
  return panel[1];
}

describe("SetupGuidePanel official downloads", () => {
  it("renders prerequisites before setup instructions, plus provider setup and first-run steps", () => {
    const markup = renderGuide({
      source_url: "https://github.com/example/agent",
      checked_at: "2026-10-25",
      platforms: {
        windows: {
          support: "supported",
          prerequisites: ["Node.js 20+"],
          install_route: "Install the package, then run it.",
          provider_setup: "Configure the model API key in the application.",
          first_run_steps: ["Create a project.", "Run a test prompt."],
          install_commands: ["npm install example-agent"],
        },
      },
    });

    const windows = getWindowsPanelMarkup(markup);

    expect(windows).toContain("Prerequisites");
    expect(windows).toContain("Node.js 20+");
    expect(windows.indexOf("Prerequisites")).toBeLessThan(windows.indexOf("Install commands"));
    expect(windows.indexOf("Node.js 20+")).toBeLessThan(windows.indexOf("Install the package"));
    expect(windows.indexOf("Install the package")).toBeLessThan(windows.indexOf("Install commands"));
    expect(windows.indexOf("Node.js 20+")).toBeLessThan(windows.indexOf("npm install example-agent"));
    expect(windows).toContain("Provider setup");
    expect(windows).toContain("Configure the model API key in the application.");
    expect(windows).toContain("First run");
    expect(windows).toContain("Create a project.");
    expect(windows).toContain("Run a test prompt.");
  });

  it("groups multiple install commands into one ordered sequence with individual copy actions", () => {
    const markup = renderGuide({
      source_url: "https://github.com/example/agent",
      checked_at: "2026-10-25",
      platforms: {
        windows: {
          support: "supported",
          install_commands: [
            "git clone https://github.com/example/agent.git",
            "cd agent",
            "python -m pip install -e .",
          ],
        },
      },
    });

    const windows = getWindowsPanelMarkup(markup);
    const sequence = windows.match(/<ol class="setup-command-sequence">(.*?)<\/ol>/)?.[1];

    expect(sequence).toBeDefined();
    expect(windows.match(/<h4>Install commands<\/h4>/g)).toHaveLength(1);
    expect(windows).toContain("Run these commands in order.");
    expect(sequence).toContain('aria-label="Copy command 1 (Install commands)"');
    expect(sequence).toContain('aria-label="Copy command 2 (Install commands)"');
    expect(sequence).toContain('aria-label="Copy command 3 (Install commands)"');
    expect(sequence!.indexOf("git clone")).toBeLessThan(sequence!.indexOf("cd agent"));
    expect(sequence!.indexOf("cd agent")).toBeLessThan(sequence!.indexOf("python -m pip install -e ."));
    expect(windows).not.toContain("<strong>Install commands</strong>");
  });

  it("renders source-checked phases and places provider setup before commands", () => {
    const markup = renderGuide({
      source_url: "https://github.com/example/agent",
      checked_at: "2026-10-26",
      platforms: {
        windows: {
          support: "supported",
          provider_setup: "Set the required keys in .env before setup.",
          terminal_note: "Run setup and start the MCP server in this terminal. Leave it running, open a second terminal, and start Streamlit there.",
          install_commands: ["git clone example", "cd example", "uv sync"],
          command_phases: [
            { title: "Prepare", commands: ["git clone example", "cd example"] },
            { title: "Install dependencies", commands: ["uv sync"] },
            { title: "Configure", commands: [], note: "Edit the environment file." },
          ],
        },
      },
    });

    const windows = getWindowsPanelMarkup(markup);

    expect(windows.indexOf("Set the required keys")).toBeLessThan(windows.indexOf("Prepare"));
    expect(windows.indexOf("Prepare")).toBeLessThan(windows.indexOf("Install dependencies"));
    expect(windows.indexOf("Install dependencies")).toBeLessThan(windows.indexOf("Configure"));
    expect(windows).toContain("open a second terminal");
    expect(windows).toContain("Edit the environment file.");
    expect(windows.match(/class="setup-command-sequence"/g)).toHaveLength(2);
    expect(windows).toContain('aria-label="Copy command 1 (Prepare)"');
  });

  it("renders terminal guidance before legacy multi-command sequences", () => {
    const markup = renderGuide({
      platforms: {
        windows: {
          support: "supported",
          terminal_note: "Run all commands in this same terminal. After `cd`, stay in the project folder.",
          install_commands: ["git clone https://github.com/example/agent.git", "cd agent", "npm install"],
        },
      },
    });

    const windows = getWindowsPanelMarkup(markup);

    expect(windows.indexOf("same terminal")).toBeLessThan(windows.indexOf("Install commands"));
    expect(windows.indexOf("same terminal")).toBeLessThan(windows.indexOf("git clone"));
  });

  it("does not show a missing-shell-command message when a reviewed official download exists", () => {
    const markup = renderGuide({
      source_url: "https://github.com/example/agent",
      checked_at: "2026-10-20",
      platforms: {
        windows: {
          support: "supported",
          download_url: "https://example.com/agent-installer",
          install_commands: [],
          uninstall_commands: [],
        },
      },
    });

    const windows = getWindowsPanelMarkup(markup);

    expect(windows).toContain('href="https://example.com/agent-installer"');
    expect(windows).toContain("Official download");
    expect(windows).not.toContain("No shell commands are recorded for this OS.");
    expect(windows).not.toContain("No shell install command is listed.");
  });

  it("does not show an install-instructions warning when an unreviewed platform has an official download", () => {
    const markup = renderGuide({
      platforms: {
        windows: {
          support: "unknown",
          download_url: "https://example.com/agent-installer",
          install_commands: [],
          uninstall_commands: [],
        },
      },
    });

    const windows = getWindowsPanelMarkup(markup);

    expect(windows).toContain("Official download");
    expect(windows).not.toContain("Install instructions have not been reviewed.");
    expect(windows).not.toContain("No shell install command is listed.");
    expect(windows).toContain("Removal instructions have not been reviewed.");
  });

  it("uses a custom label when the URL is a marketplace or download page rather than an installer", () => {
    const markup = renderGuide({
      platforms: {
        windows: {
          support: "supported",
          download_url: "https://marketplace.visualstudio.com/items?itemName=Continue.continue",
          download_label: "Official Marketplace listing",
        },
      },
    });

    const windows = getWindowsPanelMarkup(markup);

    expect(windows).toContain("Official Marketplace listing");
    expect(windows).not.toContain(">Official download</a>");
  });

  it("keeps the reviewed-empty message when neither commands nor an official download are recorded", () => {
    const markup = renderGuide({
      source_url: "https://github.com/example/agent",
      checked_at: "2026-10-20",
      platforms: {
        windows: {
          support: "supported",
          install_commands: [],
          uninstall_commands: [],
        },
      },
    });

    expect(getWindowsPanelMarkup(markup)).toContain("No shell commands are recorded for this OS.");
  });
});
