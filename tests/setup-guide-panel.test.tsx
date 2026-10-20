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
