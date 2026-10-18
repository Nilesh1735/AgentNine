export const MAX_COMPARE_AGENTS = 3;

import type { Agent } from "./types";

const setupPlatforms = ["windows", "macos", "linux"] as const;

type SetupCommandAgent = Pick<Agent, "os_commands" | "setup_guide">;

function hasCommands(commands: string[] | undefined): boolean {
  return commands?.some((command) => command.trim().length > 0) ?? false;
}

export function getSetupCommandPlatforms(agent: SetupCommandAgent): Array<typeof setupPlatforms[number]> {
  return setupPlatforms.filter((platform) => {
    if (agent.setup_guide?.platforms?.[platform]?.support === "unsupported") return false;
    return hasCommands(agent.os_commands?.[platform])
      || hasCommands(agent.setup_guide?.platforms?.[platform]?.install_commands)
      || hasCommands(agent.setup_guide?.platforms?.[platform]?.first_run_commands);
  });
}

export function hasSetupCommands(agent: SetupCommandAgent): boolean {
  return getSetupCommandPlatforms(agent).length > 0;
}

export function normalizeCompareSlugs(value: string[] | readonly string[]) {
  return [...new Set(value.filter((slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)))].slice(0, MAX_COMPARE_AGENTS);
}

export function toggleCompareSlug(slugs: string[], slug: string) {
  const current = slugs.includes(slug) ? slugs.filter((item) => item !== slug) : [...slugs, slug];
  return normalizeCompareSlugs(current);
}
