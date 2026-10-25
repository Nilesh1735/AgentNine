import type { Agent } from "./types";
import { formatCatalogDate } from "./agent-metadata-display";

const FRESHNESS_WINDOW_MS = 180 * 24 * 60 * 60 * 1000;

export type TrustAgent = Pick<
  Agent,
  | "is_archived"
  | "status"
  | "metadata_is_stale"
  | "metadata_last_checked_at"
  | "last_commit_at"
  | "upstream_changed_since_verification"
  | "upstream_is_archived"
  | "last_verified_date"
  | "verification_score"
  | "setup_guide"
>;

function validDate(value: string | null | undefined) {
  if (!value || value === "Not verified") return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

export type TrustState = {
  key: "verified" | "needs-review" | "archived" | "unknown";
  label: string;
  detail: string;
  className: string;
  isStale: boolean;
};

export function getAgentTrustState(agent: TrustAgent, now = Date.now()): TrustState {
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
      key: "needs-review",
      label: "Needs review",
      detail: "Needs review.",
      className: "trust-state trust-state-stale",
      isStale: true,
    };
  }
  if (agent.upstream_is_archived) {
    return {
      key: "needs-review",
      label: "Needs review",
      detail: "The upstream repository is archived; review the listing and its supported setup before relying on it.",
      className: "trust-state trust-state-stale",
      isStale: true,
    };
  }
  if (agent.upstream_changed_since_verification) {
    return {
      key: "needs-review",
      label: "Needs review",
      detail: "The project repository changed after the recorded verification; its current setup needs review.",
      className: "trust-state trust-state-stale",
      isStale: true,
    };
  }
  const guide = agent.setup_guide;
  const hasCompleteVerification = Boolean(
    agent.verification_score === 5
    && guide.source_url
    && validDate(guide.checked_at)
    && verifiedAt !== null,
  );
  if (hasCompleteVerification) {
    return {
      key: "verified",
      label: "Verified",
      detail: "All five setup verification steps are complete.",
      className: "trust-state trust-state-verified",
      isStale: false,
    };
  }
  return {
    key: "unknown",
    label: "Needs review",
    detail: "Current setup documentation and runtime verification evidence are not recorded for this listing.",
    className: "trust-state trust-state-unknown",
    isStale: false,
  };
}

export function getFreshnessNote(agent: Agent, includeUpstreamActivity = true): string {
  const metadataDate = formatCatalogDate(agent.metadata_last_checked_at);
  if (metadataDate) return `Repository metadata checked ${metadataDate}.`;
  if (includeUpstreamActivity) {
    const commitDate = formatCatalogDate(agent.last_commit_at);
    if (commitDate) return `Latest project commit recorded ${commitDate}.`;
  }
  return "";
}
