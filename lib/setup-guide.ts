import type { SetupGuide, SetupPlatform } from "@/lib/types";

const operatingSystems = ["windows", "macos", "linux"] as const;
const listFields = ["prerequisites", "install_commands", "first_run_commands", "first_run_steps", "uninstall_commands", "uninstall_steps"] as const;
const textFields = ["install_route", "hardware_notes", "download_url", "download_label", "provider_setup", "data_retention", "terminal_note"] as const;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isSetupCommandPhase(value: unknown): value is NonNullable<SetupPlatform["command_phases"]>[number] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const phase = value as Record<string, unknown>;
  return typeof phase.title === "string"
    && phase.title.trim().length > 0
    && phase.title.length <= 100
    && isStringArray(phase.commands)
    && phase.commands.every((command) => command.length <= 4000)
    && (phase.note === undefined || (typeof phase.note === "string" && phase.note.length <= 4000))
    && (phase.commands.length > 0 || (typeof phase.note === "string" && Boolean(phase.note.trim())));
}

export function isHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function normalizeSetupGuide(value: unknown): SetupGuide {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  const rawPlatforms = record.platforms;
  const platforms = rawPlatforms && typeof rawPlatforms === "object" && !Array.isArray(rawPlatforms)
    ? rawPlatforms as Record<string, unknown>
    : {};
  const normalizedPlatforms: NonNullable<SetupGuide["platforms"]> = {};
  for (const os of operatingSystems) {
    const rawPlatform = platforms[os];
    if (!rawPlatform || typeof rawPlatform !== "object" || Array.isArray(rawPlatform)) continue;
    const platform = rawPlatform as Record<string, unknown>;
    const normalized: SetupPlatform = {
      support: platform.support === "supported" || platform.support === "unsupported" ? platform.support : "unknown",
    };
    for (const field of textFields) {
      if (typeof platform[field] === "string" && (field !== "download_url" || isHttpsUrl(platform[field] as string))) normalized[field] = platform[field];
    }
    for (const field of listFields) {
      if (isStringArray(platform[field])) normalized[field] = platform[field];
    }
    if (Array.isArray(platform.command_phases)
      && platform.command_phases.length <= 20
      && platform.command_phases.every(isSetupCommandPhase)) {
      const phases = platform.command_phases;
      const commands = phases.flatMap((phase) => phase.commands);
      if (commands.length && commands.every((command, index) => command === normalized.install_commands?.[index])
        && commands.length === normalized.install_commands?.length) {
        normalized.command_phases = phases;
      }
    }
    normalizedPlatforms[os] = normalized;
  }
  const sourceUrl = typeof record.source_url === "string" && isHttpsUrl(record.source_url) ? record.source_url : undefined;
  return {
    ...(sourceUrl ? { source_url: sourceUrl } : {}),
    ...(typeof record.source_version === "string" ? { source_version: record.source_version } : {}),
    ...(typeof record.checked_at === "string" ? { checked_at: record.checked_at } : {}),
    ...(typeof record.notes === "string" ? { notes: record.notes } : {}),
    platforms: normalizedPlatforms,
  };
}

export function validateSetupGuide(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const guide = value as Record<string, unknown>;
  for (const field of ["source_url", "source_version", "checked_at", "notes"]) {
    if (guide[field] !== undefined && (typeof guide[field] !== "string" || guide[field].length > 4000)) return false;
  }
  if (typeof guide.source_url === "string" && guide.source_url && !isHttpsUrl(guide.source_url)) return false;
  if (typeof guide.checked_at === "string" && guide.checked_at && !/^\d{4}-\d{2}-\d{2}$/.test(guide.checked_at)) return false;
  if (guide.platforms === undefined) return true;
  if (!guide.platforms || typeof guide.platforms !== "object" || Array.isArray(guide.platforms)) return false;

  const platforms = guide.platforms as Record<string, unknown>;
  let hasDocumentedSupport = false;
  for (const [os, rawPlatform] of Object.entries(platforms)) {
    if (!operatingSystems.includes(os as typeof operatingSystems[number]) || !rawPlatform || typeof rawPlatform !== "object" || Array.isArray(rawPlatform)) return false;
    const platform = rawPlatform as Record<string, unknown>;
    if (platform.support !== "supported" && platform.support !== "unsupported" && platform.support !== "unknown") return false;
    if (platform.support !== "unknown") hasDocumentedSupport = true;
    for (const field of textFields) {
      if (platform[field] !== undefined && (typeof platform[field] !== "string" || platform[field].length > 4000)) return false;
    }
    if (typeof platform.download_url === "string" && platform.download_url && !isHttpsUrl(platform.download_url)) return false;
    for (const field of listFields) {
      const entries = platform[field];
      if (entries !== undefined && (!isStringArray(entries) || entries.length > 50 || entries.some((item) => item.length > 4000))) return false;
    }
    if (platform.terminal_note !== undefined
      && (typeof platform.terminal_note !== "string" || platform.terminal_note.length > 4000)) return false;
    if (platform.command_phases !== undefined) {
      if (!Array.isArray(platform.command_phases)
        || platform.command_phases.length === 0
        || platform.command_phases.length > 20
        || !platform.command_phases.every(isSetupCommandPhase)) return false;
      const commands = platform.command_phases.flatMap((phase) => phase.commands);
      const installCommands = platform.install_commands;
      if (!commands.length
        || !isStringArray(installCommands)
        || commands.length !== installCommands.length
        || commands.some((command, index) => command !== installCommands[index])) return false;
    }
  }
  return !hasDocumentedSupport || Boolean(guide.source_url && guide.checked_at);
}
