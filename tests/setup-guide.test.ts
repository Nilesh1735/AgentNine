import { describe, expect, it } from "vitest";
import { normalizeSetupGuide, validateSetupGuide } from "@/lib/setup-guide";

describe("evidence-based setup guides", () => {
  it("allows unknown platforms without claiming support", () => {
    const guide = {
      platforms: {
        windows: { support: "unknown" },
        macos: { support: "unknown" },
        linux: { support: "unknown" },
      },
    };

    expect(validateSetupGuide(guide)).toBe(true);
    expect(normalizeSetupGuide(guide).platforms?.windows?.support).toBe("unknown");
  });

  it("requires an HTTPS source and check date for documented support", () => {
    const guide = {
      source_url: "https://docs.example.org/install",
      checked_at: "2026-10-06",
      platforms: { windows: { support: "supported", install_commands: ["example install"] } },
    };

    expect(validateSetupGuide(guide)).toBe(true);
    expect(validateSetupGuide({ ...guide, source_url: "javascript:alert(1)" })).toBe(false);
    expect(validateSetupGuide({ ...guide, checked_at: undefined })).toBe(false);
  });

  it("rejects invalid platforms, dates, and oversized command lists", () => {
    expect(validateSetupGuide({ platforms: { android: { support: "supported" } } })).toBe(false);
    expect(validateSetupGuide({ platforms: { ios: { support: "supported" } } })).toBe(false);
    expect(validateSetupGuide({ checked_at: "10/06/2026" })).toBe(false);
    expect(validateSetupGuide({
      platforms: { linux: { support: "unknown", install_commands: Array(51).fill("install") } },
    })).toBe(false);
  });

  it("does not expose malformed source URLs from stored records", () => {
    expect(normalizeSetupGuide({
      source_url: "javascript:alert(1)",
      platforms: { windows: { support: "supported" } },
    })).toEqual({ platforms: { windows: { support: "supported" } } });
  });

  it("accepts only HTTPS download links and preserves structured instructions", () => {
    const guide = {
      source_url: "https://docs.example.org/install",
      checked_at: "2026-10-06",
      platforms: {
        windows: {
          support: "supported",
          hardware_notes: "Windows x64",
          download_url: "https://downloads.example.org/agent.exe",
          first_run_steps: ["Open the app"],
          uninstall_steps: ["Use the uninstaller"],
        },
      },
    };

    expect(validateSetupGuide(guide)).toBe(true);
    expect(validateSetupGuide({
      ...guide,
      platforms: { windows: { support: "supported", download_url: "javascript:alert(1)" } },
    })).toBe(false);
    expect(normalizeSetupGuide(guide).platforms?.windows).toMatchObject({
      hardware_notes: "Windows x64",
      download_url: "https://downloads.example.org/agent.exe",
      first_run_steps: ["Open the app"],
      uninstall_steps: ["Use the uninstaller"],
    });
  });
});
