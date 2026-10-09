import type { Agent } from "./types";

export function formatCatalogDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
}

export function getCompactVersionLabel(versionTag: string): string {
  const value = versionTag.trim();
  if (!value) return "Version not recorded";
  if (/^no github release\b/i.test(value)) return "No GitHub release";
  if (/^no release found$/i.test(value)) return "No release found";
  if (/^no (?:published )?release verified\b/i.test(value)) return "Release not verified";
  if (/^unversioned\b/i.test(value)) return "Unversioned";
  const repositoryTag = value.match(/^(?:version\s+)?repo tag\s+(v?[^\s;,)]+)/i);
  if (repositoryTag) return repositoryTag[1];
  const conciseValue = value.replace(/\s+\([^)]*\)/g, "").trim();
  const versions = conciseValue.match(/\bv?\d+\.\d+(?:\.\d+){0,2}(?:[-+][\w.-]+)?\b/g) ?? [];
  if (versions.length > 1) return "Multiple versions";
  return conciseValue || "Version not recorded";
}

export function getReleaseRecord(agent: Pick<Agent, "version_tag" | "last_release_at">): string {
  const versionTag = agent.version_tag.toLowerCase();
  if (versionTag.includes("no github release")) return "No GitHub release found";
  if (versionTag.includes("not a verified github release")) return "GitHub release not verified";
  if (versionTag.includes("no published release verified") || versionTag.includes("no verified release")) {
    return "No published release verified";
  }
  if (versionTag.includes("release date not verified")) return "Release date not verified";
  if (versionTag.includes("release date not documented")) return "Release date not documented";
  if (/^unversioned\b/i.test(agent.version_tag.trim())) return "No versioned release identified";
  const releaseDate = formatCatalogDate(agent.last_release_at);
  if (releaseDate) return `Release date recorded: ${releaseDate}`;
  return "Release date not recorded";
}

export function getRepositoryFreshnessLabel(
  agent: Pick<Agent, "metadata_last_checked_at" | "last_commit_at">,
  includeUpstreamActivity = true,
): string {
  const metadataDate = formatCatalogDate(agent.metadata_last_checked_at);
  if (metadataDate) return `Checked ${metadataDate}`;
  if (includeUpstreamActivity) {
    const commitDate = formatCatalogDate(agent.last_commit_at);
    if (commitDate) return `Commit ${commitDate}`;
  }
  return "Not checked";
}
