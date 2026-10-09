import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { validateSetupGuide } from "@/lib/setup-guide";

const initialSql = readFileSync(new URL("../supabase/030-evidence-based-setup-guides.sql", import.meta.url), "utf8");
const followupSql = readFileSync(new URL("../supabase/031-complete-setup-install-routes.sql", import.meta.url), "utf8");
const auditSql = readFileSync(new URL("../supabase/032-complete-os-coverage.sql", import.meta.url), "utf8");

type Platform = {
  support: "supported" | "unsupported" | "unknown";
  install_route?: string;
  install_commands?: string[];
  first_run_commands?: string[];
  download_url?: string;
};

type Guide = {
  slug: string;
  source_url: string;
  checked_at: string;
  notes?: string;
  platforms: Record<string, Platform>;
};

function readJsonBlock<T>(source: string, tag: string): T {
  const match = source.match(new RegExp(`\\$${tag}\\$([\\s\\S]*?)\\$${tag}\\$::jsonb`));
  if (!match) throw new Error(`Could not locate ${tag} data`);
  return JSON.parse(match[1]) as T;
}

function getInitialGuides() {
  return readJsonBlock<Guide[]>(initialSql, "guide_data");
}

function getFollowupGuides() {
  return readJsonBlock<Array<{
    slug: string;
    platforms: Record<string, Platform>;
  }>>(followupSql, "guide_updates");
}

function getAuditPlatformUpdates() {
  return readJsonBlock<Array<{
    slug: string;
    os: "windows" | "macos" | "linux";
    platform: Platform;
  }>>(auditSql, "platform_updates");
}

function getFinalGuides() {
  const guides = new Map(getInitialGuides().map((guide) => [
    guide.slug,
    { ...guide, platforms: { ...guide.platforms } },
  ]));

  for (const update of getFollowupGuides()) {
    const guide = guides.get(update.slug);
    if (!guide) throw new Error(`Follow-up references unknown agent ${update.slug}`);
    for (const [os, patch] of Object.entries(update.platforms)) {
      const current = guide.platforms[os];
      const merged = { ...patch, ...current };
      if (!current?.install_commands?.length) {
        merged.install_commands = patch.install_commands ?? current?.install_commands;
      }
      guide.platforms[os] = merged;
    }
  }

  for (const update of getAuditPlatformUpdates()) {
    const guide = guides.get(update.slug);
    if (!guide) throw new Error(`Audit references unknown agent ${update.slug}`);
    guide.platforms[update.os] = { ...guide.platforms[update.os], ...update.platform };
  }

  return [...guides.values()];
}

describe("audited setup-guide OS coverage", () => {
  it("gives all 71 catalog agents an explicit state for Windows, macOS, and Linux", () => {
    const guides = getFinalGuides();
    const expectedOperatingSystems = ["linux", "macos", "windows"];

    expect(guides).toHaveLength(71);
    expect(new Set(guides.map((guide) => guide.slug)).size).toBe(71);

    for (const guide of guides) {
      expect(Object.keys(guide.platforms).sort(), guide.slug).toEqual(expectedOperatingSystems);
      expect(validateSetupGuide(guide), guide.slug).toBe(true);

      for (const [os, platform] of Object.entries(guide.platforms)) {
        if (platform.support === "supported") {
          expect(
            (platform.install_commands?.length ?? 0) > 0 || Boolean(platform.download_url),
            `${guide.slug} ${os} is marked supported without an install route`,
          ).toBe(true);
        }
        if (platform.support === "unknown" && !platform.install_commands?.length && !platform.download_url) {
          expect(platform.install_route, `${guide.slug} ${os} needs an explicit unknown-state explanation`).toContain("No verified");
        }
      }

      expect(
        Object.values(guide.platforms).some((platform) =>
          platform.support === "supported" && (Boolean(platform.install_commands?.length) || Boolean(platform.download_url)),
        ),
        `${guide.slug} has no supported install route`,
      ).toBe(true);
    }
  });

  it("records verified platform corrections and the Windows-specific command-code launcher", () => {
    const updates = getAuditPlatformUpdates();
    const byKey = new Map(updates.map((update) => [`${update.slug}:${update.os}`, update.platform]));

    expect(new Set(updates.map((update) => `${update.slug}:${update.os}`)).size).toBe(updates.length);
    expect(byKey.get("gemini-cli:windows")?.install_commands).toContain("npm install -g @google/gemini-cli");
    expect(byKey.get("gemini-cli:windows")?.first_run_commands).toContain("gemini");
    expect(byKey.get("crush:macos")?.install_commands).toContain("brew install charmbracelet/tap/crush");
    expect(byKey.get("comfyui:macos")?.download_url).toBe("https://www.comfy.org/download");
    expect(auditSql).toContain("jsonb_object_agg(operating_system, platform)");
    expect(auditSql).toContain("group by id");
    expect(auditSql).toContain("existing_platform.value = '{\"support\":\"unknown\"}'::jsonb");
    expect(auditSql).toContain("'{platforms,windows,first_run_commands}'");
    expect(auditSql).toContain("'[\"command-code\"]'::jsonb");
    expect(auditSql).toContain("= '[\"cmd\"]'::jsonb");
  });
});
