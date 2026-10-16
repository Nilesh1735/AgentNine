import type { Agent, SetupPlatform } from "@/lib/types";

const operatingSystems = ["linux", "macos", "windows"] as const;

export type SearchAgent = Pick<
  Agent,
  | "id"
  | "name"
  | "slug"
  | "short_description"
  | "category_id"
  | "tags"
  | "github_url"
  | "network_access"
  | "file_access"
  | "hardware_requirements"
  | "cost_to_run"
  | "requires_api_key"
  | "verification_score"
  | "last_commit_at"
  | "stars"
  | "os_commands"
  | "verified_operating_systems"
> & {
  setup_guide: {
    platforms?: Partial<Record<typeof operatingSystems[number], Pick<SetupPlatform, "support">>>;
  };
};

export function toSearchAgent(agent: Agent): SearchAgent {
  const platforms: NonNullable<SearchAgent["setup_guide"]["platforms"]> = {};
  for (const os of operatingSystems) {
    const support = agent.setup_guide.platforms?.[os]?.support;
    if (support) platforms[os] = { support };
  }

  return {
    id: agent.id,
    name: agent.name,
    slug: agent.slug,
    short_description: agent.short_description,
    category_id: agent.category_id,
    tags: agent.tags,
    github_url: agent.github_url,
    network_access: agent.network_access,
    file_access: agent.file_access,
    hardware_requirements: agent.hardware_requirements,
    cost_to_run: agent.cost_to_run,
    requires_api_key: agent.requires_api_key,
    verification_score: agent.verification_score,
    last_commit_at: agent.last_commit_at,
    stars: agent.stars,
    os_commands: agent.os_commands,
    verified_operating_systems: agent.verified_operating_systems,
    setup_guide: { platforms },
  };
}
