export type OsCommands = {
  macos?: string[];
  linux?: string[];
  windows?: string[];
};

export type SetupPlatform = {
  support: "supported" | "unsupported" | "unknown";
  install_route?: string;
  prerequisites?: string[];
  hardware_notes?: string;
  download_url?: string;
  install_commands?: string[];
  first_run_commands?: string[];
  first_run_steps?: string[];
  provider_setup?: string;
  uninstall_commands?: string[];
  uninstall_steps?: string[];
  data_retention?: string;
};

export type SetupGuide = {
  source_url?: string;
  source_version?: string;
  checked_at?: string;
  notes?: string;
  platforms?: Partial<Record<"windows" | "macos" | "linux", SetupPlatform>>;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

export type Agent = {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  category_id: string;
  tags: string[];
  github_url: string | null;
  version_tag: string;
  os_commands: OsCommands;
  env_template: string;
  common_errors: string;
  hardware_requirements: string;
  port_mapping: string;
  memory_location: string;
  network_access: string;
  file_access: string;
  uninstall_command: string;
  first_launch_prompt: string;
  cost_to_run: string;
  requires_api_key: boolean | null;
  is_flagship: boolean;
  status: string;
  last_verified_date: string;
  stars: number;
  last_commit_at: string;
  is_archived: boolean;
  setup_steps: string[];
  setup_guide: SetupGuide;
  verification_score: number;
  revision: number;
  metadata_last_checked_at?: string | null;
  metadata_is_stale?: boolean | null;
  metadata_source?: string | null;
  verified_commit_sha?: string | null;
  verified_operating_systems: string[];
  verified_install_command: string;
  verified_first_task: string;
  verification_failure_conditions: string;
  verification_notes: string;
  upstream_changed_since_verification: boolean;
  last_release_at?: string | null;
};

export type HelpfulnessSummary = {
  helpful: number;
  notHelpful: number;
  total: number;
};
