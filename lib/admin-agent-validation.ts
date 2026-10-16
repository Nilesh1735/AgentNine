const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const textLimits: Record<string, number> = {
  short_description: 1000,
  version_tag: 200,
  env_template: 10_000,
  common_errors: 10_000,
  hardware_requirements: 4000,
  port_mapping: 2000,
  memory_location: 2000,
  network_access: 4000,
  file_access: 4000,
  uninstall_command: 4000,
  first_launch_prompt: 4000,
  cost_to_run: 1000,
};

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateAdminAgentScalars(input: Record<string, unknown>): void {
  if ("category_id" in input && input.category_id !== null && input.category_id !== "" && (typeof input.category_id !== "string" || !uuid.test(input.category_id))) {
    throw new Error("Invalid category");
  }
  if ("requires_api_key" in input && input.requires_api_key !== null && typeof input.requires_api_key !== "boolean") {
    throw new Error("Invalid API key requirement");
  }
  if ("is_flagship" in input && typeof input.is_flagship !== "boolean") {
    throw new Error("Invalid flagship state");
  }
  if ("is_archived" in input && typeof input.is_archived !== "boolean") {
    throw new Error("Invalid archive state");
  }
  if ("stars" in input && input.stars !== null && input.stars !== undefined && (!Number.isInteger(input.stars) || (input.stars as number) < 0 || (input.stars as number) > 2_147_483_647)) {
    throw new Error("Invalid star count");
  }
  if ("last_verified_date" in input && input.last_verified_date !== null && input.last_verified_date !== "" && input.last_verified_date !== "Not verified" && (typeof input.last_verified_date !== "string" || !isValidDateOnly(input.last_verified_date))) {
    throw new Error("Invalid setup review date");
  }
  if ("last_commit_at" in input && input.last_commit_at !== null && input.last_commit_at !== "" && (typeof input.last_commit_at !== "string" || !Number.isFinite(new Date(input.last_commit_at).getTime()))) {
    throw new Error("Invalid repository commit date");
  }

  for (const [field, maxLength] of Object.entries(textLimits)) {
    const value = input[field];
    if (value !== undefined && value !== null && (typeof value !== "string" || value.length > maxLength)) {
      throw new Error(`Invalid ${field}`);
    }
  }
  if (input.slug !== undefined && (typeof input.slug !== "string" || input.slug.length > 160)) {
    throw new Error("Invalid slug");
  }
  if (input.github_url !== undefined && (typeof input.github_url !== "string" || input.github_url.length > 2048)) {
    throw new Error("Invalid GitHub source URL");
  }
  if (input.tags !== undefined && input.tags !== null && (!Array.isArray(input.tags) || input.tags.length > 50 || input.tags.some((tag) => typeof tag !== "string" || tag.length > 100))) {
    throw new Error("Invalid tags");
  }
  if (input.os_commands !== undefined && input.os_commands !== null) {
    if (typeof input.os_commands !== "object" || Array.isArray(input.os_commands)) throw new Error("Invalid os_commands");
    const commands = input.os_commands as Record<string, unknown>;
    if (Object.keys(commands).some((key) => !["linux", "macos", "windows"].includes(key))) throw new Error("Invalid os_commands");
  }
}
