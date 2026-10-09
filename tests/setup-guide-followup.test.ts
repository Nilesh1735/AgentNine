import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { validateSetupGuide } from "@/lib/setup-guide";

const followupSql = readFileSync(new URL("../supabase/031-complete-setup-install-routes.sql", import.meta.url), "utf8");
const initialGuideSql = readFileSync(new URL("../supabase/030-evidence-based-setup-guides.sql", import.meta.url), "utf8");

function getGuideUpdates() {
  const match = followupSql.match(/\$guide_updates\$([\s\S]*?)\$guide_updates\$::jsonb/);
  if (!match) throw new Error("Could not locate follow-up setup guide data");
  return JSON.parse(match[1]) as Array<{
    slug: string;
    source_url: string;
    checked_at: string;
    notes?: string;
    platforms: Record<string, {
      support: string;
      first_run_commands?: string[];
      first_run_steps?: string[];
      install_commands?: string[];
      download_url?: string;
    }>;
  }>;
}

function getInitialBrowserOsGuide() {
  const match = initialGuideSql.match(/\$guide_data\$([\s\S]*?)\$guide_data\$::jsonb/);
  if (!match) throw new Error("Could not locate initial setup guide data");
  const guides = JSON.parse(match[1]) as Array<{
    slug: string;
    platforms: Record<string, {
      install_commands?: string[];
    }>;
  }>;
  return guides.find((guide) => guide.slug === "browseros");
}

describe("follow-up setup guide corrections", () => {
  it("adds sourced install commands or official download links for each reviewed gap", () => {
    const updates = getGuideUpdates();
    const slugs = updates.map((guide) => guide.slug);
    const bySlug = new Map(updates.map((guide) => [guide.slug, guide]));
    const identifiedGaps: Record<string, string[]> = {
      "cherry-studio": ["windows", "macos", "linux"],
      "command-code": ["windows", "macos", "linux"],
      "codebuff": ["windows", "macos", "linux"],
      "skales": ["windows", "macos", "linux"],
      "browseros": ["windows", "linux"],
      "cline": ["windows", "macos"],
      "surfsense": ["windows", "macos", "linux"],
      "opencreator": ["windows", "macos"],
      "smartsub": ["windows", "linux"],
      "kilocode": ["windows"],
      "node-banana": ["macos"],
      "librechat": ["windows", "macos", "linux"],
      "insights-lm-public": ["windows", "macos", "linux"],
      "swe-agent": ["windows", "macos", "linux"],
    };

    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toContain("open-webui");
    expect(slugs).toContain("openhands");
    expect(bySlug.get("command-code")?.platforms.windows.install_commands).toContain("npm install -g command-code");
    expect(bySlug.get("node-banana")?.platforms.macos.download_url).toBe("https://nodebanana.app/download/mac");
    expect(getInitialBrowserOsGuide()?.platforms.macos.install_commands).toContain("brew tap browseros-ai/tap && brew install --cask browseros-neo");
    expect(bySlug.get("browseros")?.platforms.windows.download_url).toBe("https://cdn.browseros.com/download/BrowserOS_neo_installer.exe");
    expect(bySlug.get("browseros")?.platforms.linux.download_url).toBe("https://cdn.browseros.com/download/BrowserOS_neo.AppImage");
    expect(bySlug.get("librechat")?.platforms.windows.install_commands).toContain("docker compose up -d");
    expect(bySlug.get("insights-lm-public")?.platforms.windows.first_run_commands).toContain("npm run dev");
    expect(bySlug.get("insights-lm-public")?.notes).toContain("frontend only");
    expect(bySlug.get("swe-agent")?.platforms.linux.install_commands).toContain("python -m pip install --editable .");
    expect(bySlug.get("swe-agent")?.notes).toContain("mini-SWE-agent");
    for (const [slug, platforms] of Object.entries(identifiedGaps)) {
      for (const os of platforms) {
        const platform = bySlug.get(slug)?.platforms[os];
        expect(platform, `${slug} ${os}`).toBeDefined();
        expect(
          (platform?.install_commands?.length ?? 0) > 0 || Boolean(platform?.download_url),
          `${slug} ${os} remains without an install route`,
        ).toBe(true);
      }
    }

    for (const guide of updates) {
      expect(validateSetupGuide(guide), guide.slug).toBe(true);
      expect(guide.checked_at).toBe("2026-10-07");
      for (const platform of Object.values(guide.platforms)) {
        expect((platform.install_commands?.length ?? 0) > 0 || Boolean(platform.download_url), guide.slug).toBe(true);
      }
    }
  });

  it("preserves existing non-empty install commands during the forward migration", () => {
    expect(followupSql).toContain("coalesce(existing_platform.value->'install_commands', '[]'::jsonb) = '[]'::jsonb");
    expect(followupSql).toContain("seeded_platform.value || coalesce(existing_platform.value, '{}'::jsonb)");
  });
});
