export const MAX_COMPARE_AGENTS = 3;

import type { Agent } from "./types";

const setupPlatforms = ["windows", "macos", "linux"] as const;

type SetupCommandAgent = Pick<Agent, "os_commands" | "setup_guide">;

function hasCommands(commands: string[] | undefined): boolean {
  return commands?.some((command) => command.trim().length > 0) ?? false;
}

export function getSetupCommandPlatforms(agent: SetupCommandAgent): Array<typeof setupPlatforms[number]> {
  return setupPlatforms.filter((platform) => (
    hasCommands(agent.os_commands?.[platform])
    || hasCommands(agent.setup_guide?.platforms?.[platform]?.install_commands)
    || hasCommands(agent.setup_guide?.platforms?.[platform]?.first_run_commands)
  ));
}

export function hasSetupCommands(agent: SetupCommandAgent): boolean {
  return getSetupCommandPlatforms(agent).length > 0;
}

export type ComparisonFit = {
  label: string;
  reasons: string[];
};

export function getComparisonFit(agents: Agent[]): ComparisonFit | null {
  if (!agents.length) return null;
  const scores = agents.map((agent) => ({
    agent,
    score: (agent.verification_score === 5 ? 2 : 0)
      + (agent.requires_api_key === false ? 1 : 0)
      + (hasSetupCommands(agent) ? 1 : 0),
  })).sort((a, b) => b.score - a.score || a.agent.name.localeCompare(b.agent.name));
  const winner = scores[0].agent;
  const reasons = [
    winner.verification_score === 5 ? "all five checklist items recorded" : "",
    winner.requires_api_key === false ? "API key not required for documented local or default setup" : "",
    hasSetupCommands(winner) ? "setup commands available for at least one platform" : "",
  ].filter(Boolean);
  return { label: winner.name, reasons };
}

export function normalizeCompareSlugs(value: string[] | readonly string[]) {
  return [...new Set(value.filter((slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)))].slice(0, MAX_COMPARE_AGENTS);
}

export function toggleCompareSlug(slugs: string[], slug: string) {
  const current = slugs.includes(slug) ? slugs.filter((item) => item !== slug) : [...slugs, slug];
  return normalizeCompareSlugs(current);
}
