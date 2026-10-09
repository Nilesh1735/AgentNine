import type { SetupGuide, SetupPlatform } from "@/lib/types";

const operatingSystems = ["windows", "macos", "linux"] as const;
const listFields = ["prerequisites", "install_commands", "first_run_commands", "first_run_steps", "uninstall_commands", "uninstall_steps"] as const;
const textFields = ["install_route", "hardware_notes", "download_url", "provider_setup", "data_retention"] as const;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
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
  }
  return !hasDocumentedSupport || Boolean(guide.source_url && guide.checked_at);
}
