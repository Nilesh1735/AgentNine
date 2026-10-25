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
  | "is_archived"
  | "status"
  | "metadata_is_stale"
  | "metadata_last_checked_at"
  | "last_commit_at"
  | "last_verified_date"
  | "upstream_changed_since_verification"
  | "upstream_is_archived"
  | "verified_commit_sha"
  | "verified_install_command"
  | "verified_first_task"
  | "verification_notes"
  | "stars"
  | "os_commands"
  | "verified_operating_systems"
> & {
  setup_guide: {
    source_url?: string;
    checked_at?: string;
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
    is_archived: agent.is_archived,
    status: agent.status,
    metadata_is_stale: agent.metadata_is_stale,
    metadata_last_checked_at: agent.metadata_last_checked_at,
    last_commit_at: agent.last_commit_at,
    last_verified_date: agent.last_verified_date,
    upstream_changed_since_verification: agent.upstream_changed_since_verification,
    upstream_is_archived: agent.upstream_is_archived,
    verified_commit_sha: agent.verified_commit_sha,
    verified_install_command: agent.verified_install_command,
    verified_first_task: agent.verified_first_task,
    verification_notes: agent.verification_notes,
    stars: agent.stars,
    os_commands: agent.os_commands,
    verified_operating_systems: agent.verified_operating_systems,
    setup_guide: {
      source_url: agent.setup_guide.source_url,
      checked_at: agent.setup_guide.checked_at,
      platforms,
    },
  };
}
