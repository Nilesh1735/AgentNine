import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { validateSetupGuide } from "@/lib/setup-guide";

const catalogSql = readFileSync(new URL("../supabase/026-agenthive-71-project-catalog.sql", import.meta.url), "utf8");
const guideSql = readFileSync(new URL("../supabase/030-evidence-based-setup-guides.sql", import.meta.url), "utf8");

function getCatalogSlugs() {
  const valuesStart = catalogSql.indexOf("  values", catalogSql.indexOf("with roster ("));
  const insertStart = catalogSql.indexOf("insert into public.agents", valuesStart);
  if (valuesStart < 0 || insertStart < 0) throw new Error("Could not locate catalog roster values");
  return [...catalogSql.slice(valuesStart, insertStart).matchAll(/^\s*\('([^']+)'/gm)].map((match) => match[1]);
}

function getGuideSeeds() {
  const match = guideSql.match(/\$guide_data\$([\s\S]*?)\$guide_data\$::jsonb/);
  if (!match) throw new Error("Could not locate README guide seed data");
  return JSON.parse(match[1]) as Array<{
    slug: string;
    source_url: string;
    checked_at: string;
    platforms: Record<string, {
      support: string;
      install_commands?: string[];
      uninstall_commands?: string[];
    }>;
  }>;
}

describe("README-sourced setup guide seeds", () => {
  it("covers every catalog agent exactly once", () => {
    const catalogSlugs = getCatalogSlugs();
    const guides = getGuideSeeds();
    const guideSlugs = guides.map((guide) => guide.slug);

    expect(catalogSlugs).toHaveLength(71);
    expect(guideSlugs).toHaveLength(71);
    expect(new Set(guideSlugs).size).toBe(71);
    expect([...guideSlugs].sort()).toEqual([...catalogSlugs].sort());
  });

  it("records dated README sources and only valid OS command lists", () => {
    for (const guide of getGuideSeeds()) {
      expect(validateSetupGuide(guide)).toBe(true);
      expect(new URL(guide.source_url).protocol).toBe("https:");
      expect(guide.checked_at).toBe("2026-10-06");
      for (const [os, platform] of Object.entries(guide.platforms)) {
        expect(["windows", "macos", "linux"]).toContain(os);
        expect(["supported", "unsupported", "unknown"]).toContain(platform.support);
        for (const commands of [platform.install_commands, platform.uninstall_commands]) {
          if (commands) expect(commands.every((command) => command.trim().length > 0)).toBe(true);
        }
      }
    }
  });

  it("records the audited OS-specific install commands without inventing uninstall commands", () => {
    const guides = new Map(getGuideSeeds().map((guide) => [guide.slug, guide]));
    const expectedCommands: Record<string, Array<[string, string]>> = {
      skyvern: [["windows", "pip install \"skyvern[all]\""], ["macos", "skyvern quickstart"], ["linux", "skyvern quickstart"]],
      "pentest-copilot": [["windows", "./run.sh start"], ["macos", "./run.sh start"], ["linux", "./run.sh start"]],
      "dark-moon": [["windows", "./install.sh"], ["linux", "./install.sh"]],
      goose: [["windows", "download_cli.sh | bash"], ["macos", "download_cli.sh | bash"], ["linux", "download_cli.sh | bash"]],
      aider: [["windows", "aider.chat/install.ps1"], ["macos", "aider.chat/install.sh"], ["linux", "aider.chat/install.sh"]],
      dexter: [["windows", "bun install"], ["macos", "bun install"], ["linux", "bun install"]],
      ragflow: [["macos", "docker compose -f docker-compose.yml up -d"], ["linux", "docker compose -f docker-compose.yml up -d"]],
      "anything-llm": [["windows", "mintplexlabs/anythingllm"], ["macos", "mintplexlabs/anythingllm"], ["linux", "mintplexlabs/anythingllm"]],
      khoj: [["windows", "py -m pip install 'khoj[local]'"], ["macos", "GGML_METAL=on"], ["linux", "python -m pip install 'khoj[local]'"]],
      maxkb: [["windows", "registry.fit2cloud.com/maxkb/maxkb"], ["linux", "registry.fit2cloud.com/maxkb/maxkb"]],
      kotaemon: [["windows", "run_windows.bat"], ["linux", "bash run_linux.sh"]],
    };

    for (const [slug, expectedPlatforms] of Object.entries(expectedCommands)) {
      const guide = guides.get(slug);
      expect(guide, `missing setup guide for ${slug}`).toBeDefined();
      for (const [os, fragment] of expectedPlatforms) {
        const platform = guide?.platforms[os];
        expect(platform?.install_commands?.join("\n"), `${slug} ${os} install`).toContain(fragment);
        expect(platform?.uninstall_commands, `${slug} ${os} uninstall`).toBeUndefined();
      }
    }
  });
});
