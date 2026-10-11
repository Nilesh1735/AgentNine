import type { Agent } from "./types";

export const OPERATING_SYSTEMS = ["windows", "macos", "linux"] as const;
export type OperatingSystem = typeof OPERATING_SYSTEMS[number];

const verifiedOperatingSystemPatterns: Record<OperatingSystem, RegExp> = {
  windows: /\bwindows?\b/i,
  macos: /\b(?:macos|mac\s+os|os\s+x|darwin)\b/i,
  linux: /\blinux\b/i,
};

export function getAgentOperatingSystems(
  agent: Pick<Agent, "os_commands" | "setup_guide" | "verified_operating_systems">,
): OperatingSystem[] {
  return OPERATING_SYSTEMS.filter((os) => {
    const support = agent.setup_guide?.platforms?.[os]?.support;
    if (support === "supported") return true;
    if (support === "unsupported") return false;

    const commands = agent.os_commands?.[os];
    if (commands?.length) return true;

    return agent.verified_operating_systems?.some((value) => verifiedOperatingSystemPatterns[os].test(value)) ?? false;
  });
}
