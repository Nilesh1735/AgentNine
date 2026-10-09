import type { Agent } from "./types";
import { formatCatalogDate } from "./agent-metadata-display";

const FRESHNESS_WINDOW_MS = 180 * 24 * 60 * 60 * 1000;

function validDate(value: string | null | undefined) {
  if (!value || value === "Not verified") return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

export type TrustState = {
  key: "verified" | "partial" | "unverified" | "stale" | "changed" | "archived" | "unknown";
  label: string;
  detail: string;
  className: string;
  isStale: boolean;
};

export function getAgentTrustState(agent: Agent, now = Date.now()): TrustState {
  const verifiedAt = validDate(agent.last_verified_date);
  const metadataAt = validDate(agent.metadata_last_checked_at);
  const commitAt = validDate(agent.last_commit_at);
  if (agent.is_archived || agent.status === "archived") {
    return { key: "archived", label: "Archived", detail: "This repository is archived.", className: "trust-state trust-state-stale", isStale: true };
  }
  const metadataStale = agent.metadata_is_stale === true
    || (metadataAt !== null && now - metadataAt > FRESHNESS_WINDOW_MS)
    || (metadataAt === null && commitAt !== null && now - commitAt > FRESHNESS_WINDOW_MS);

  if (metadataStale) {
    return {
      key: "stale",
      label: "Needs review",
      detail: "Repository metadata is older than the current review window, so recent changes may need rechecking.",
      className: "trust-state trust-state-stale",
      isStale: true,
    };
  }
  if (agent.verification_score === 5) {
    const changed = agent.upstream_changed_since_verification;
    return {
      key: changed ? "changed" : "verified",
      label: changed ? "Changed upstream" : "Verified",
      detail: changed ? "The upstream repository changed after the recorded verification." : "All five AgentNine checklist items have recorded evidence.",
      className: "trust-state trust-state-verified",
      isStale: false,
    };
  }
  if (agent.verification_score > 0) {
    return {
      key: "partial",
      label: `Partially verified (${agent.verification_score}/5)`,
      detail: "Some checklist evidence is recorded. The remaining checks are still unknown.",
      className: "trust-state trust-state-partial",
      isStale: false,
    };
  }
  if (verifiedAt === null && metadataAt === null && commitAt === null) {
    return {
      key: "unknown",
      label: "No verification record",
      detail: "No verification date or repository freshness record is available yet.",
      className: "trust-state trust-state-unknown",
      isStale: false,
    };
  }
  return {
    key: "unverified",
    label: "Unverified",
    detail: "This record does not yet have AgentNine checklist evidence.",
    className: "trust-state trust-state-unverified",
    isStale: false,
  };
}

export function getFreshnessNote(agent: Agent, includeUpstreamActivity = true): string {
  const metadataDate = formatCatalogDate(agent.metadata_last_checked_at);
  if (metadataDate) return `Repository metadata checked ${metadataDate}.`;
  if (includeUpstreamActivity) {
    const commitDate = formatCatalogDate(agent.last_commit_at);
    if (commitDate) return `Latest upstream commit recorded ${commitDate}.`;
  }
  return "";
}
