import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SetupGuidePanel } from "@/components/SetupGuidePanel";

describe("agent setup panel", () => {
  it("shows only OS-specific install and uninstall slots", () => {
    const markup = renderToStaticMarkup(createElement(SetupGuidePanel, {
      guide: {},
    }));

    expect(markup.match(/<details\b/g)).toHaveLength(3);
    expect(markup).toContain("Windows");
    expect(markup).toContain("macOS");
    expect(markup).toContain("Linux");
    expect(markup.match(/Install instructions have not been reviewed\./g)).toHaveLength(3);
    expect(markup.match(/Removal instructions have not been reviewed\./g)).toHaveLength(3);
    expect(markup).not.toContain("No install command found in the checked source.");
    expect(markup).not.toContain("No uninstall command found in the checked source.");
    expect(markup).not.toContain("Install code");
    expect(markup).not.toContain("Uninstall code");
    expect(markup).not.toContain("Project page");
    expect(markup).not.toContain("Troubleshooting");
  });

  it("renders copyable install and uninstall commands by platform", () => {
    const markup = renderToStaticMarkup(createElement(SetupGuidePanel, {
      guide: {
        platforms: {
          windows: {
            support: "supported",
            install_route: "WSL2 only",
            install_commands: ["winget install example-agent"],
            uninstall_commands: ["npm uninstall -g example-agent"],
          },
        },
      },
    }));

    expect(markup).toContain("winget install example-agent");
    expect(markup).toContain("npm uninstall -g example-agent");
    expect(markup).toContain("WSL2 only");
    expect(markup).toContain("Install code");
    expect(markup).toContain("Uninstall code");
  });

  it("shows an official installer link without a missing-command notice", () => {
    const markup = renderToStaticMarkup(createElement(SetupGuidePanel, {
      guide: {
        source_url: "https://example.org/README",
        checked_at: "2026-10-07",
        platforms: {
          windows: {
            support: "supported",
            download_url: "https://downloads.example.org/agent.exe",
          },
        },
      },
    }));

    expect(markup).not.toContain("No shell install command is listed in the checked source.");
    expect(markup).toContain('href="https://downloads.example.org/agent.exe"');
    expect(markup).toContain("Official download");
    const windowsSection = markup.match(/<details class="setup-platform"><summary>Windows<\/summary>(.*?)<\/details>/)?.[1];
    expect(windowsSection).toBeDefined();
    expect(windowsSection).not.toContain("No install command found in the checked source.");
  });

  it("omits missing-command notices for sources that have been checked", () => {
    const markup = renderToStaticMarkup(createElement(SetupGuidePanel, {
      guide: {
        platforms: {
          windows: {
            support: "supported",
          },
          linux: {
            support: "supported",
            install_commands: ["curl -fsSL https://example.org/install | sh"],
          },
        },
        source_url: "https://example.org/README",
        checked_at: "2026-10-06",
      },
    }));

    expect(markup).toContain("Install code");
    expect(markup).not.toContain("No uninstall command found in the checked source.");
    expect(markup).not.toContain("No install command found in the checked source.");
    expect(markup).not.toContain("No shell install command is listed in the checked source.");
    const linuxSection = markup.match(/<details class="setup-platform"><summary>Linux<\/summary>(.*?)<\/details>/)?.[1];
    const windowsSection = markup.match(/<details class="setup-platform"><summary>Windows<\/summary>(.*?)<\/details>/)?.[1];
    expect(linuxSection).toBeDefined();
    expect(windowsSection).toBeDefined();
    const installPosition = linuxSection?.indexOf("Install code") ?? -1;
    expect(installPosition).toBeGreaterThanOrEqual(0);
    expect(linuxSection).not.toContain("Uninstall");
    expect(linuxSection).not.toContain("No uninstall command");
    expect(windowsSection).not.toContain("Install command");
    expect(windowsSection).not.toContain("Uninstall command");
  });

  it("does not present unsupported operating systems as missing documentation", () => {
    const markup = renderToStaticMarkup(createElement(SetupGuidePanel, {
      guide: {
        platforms: {
          windows: { support: "unsupported" },
        },
      },
    }));

    expect(markup).toContain("The upstream project does not support this OS.");
    expect(markup).not.toContain("Windows</summary><p class=\"setup-platform-empty\">Install command not documented upstream.");
  });
});
