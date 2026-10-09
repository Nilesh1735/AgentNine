export const MAX_COMPARE_AGENTS = 3;

import type { Agent } from "./types";

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
      + (agent.os_commands?.linux || agent.os_commands?.macos || agent.os_commands?.windows ? 1 : 0),
  })).sort((a, b) => b.score - a.score || a.agent.name.localeCompare(b.agent.name));
  const winner = scores[0].agent;
  const reasons = [
    winner.verification_score === 5 ? "all five checklist items recorded" : "",
    winner.requires_api_key === false ? "API key not required for documented local or default setup" : "",
    winner.os_commands?.linux || winner.os_commands?.macos || winner.os_commands?.windows ? "setup commands available for at least one platform" : "",
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
