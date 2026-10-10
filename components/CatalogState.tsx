"use client";

import type { CatalogResult } from "@/lib/data";

type CatalogStateProps = {
  result: CatalogResult<unknown>;
  itemLabel: string;
  emptyDescription: string;
};

export function CatalogState({ result, itemLabel, emptyDescription }: CatalogStateProps) {
  const unavailable = result.status === "unavailable";
  return (
    <div className="empty-state" role="status" aria-live="polite">
      <p className="eyebrow">{unavailable ? "Directory unavailable" : "Directory"}</p>
      <h3>{unavailable ? `The ${itemLabel} catalog is unavailable right now.` : `No ${itemLabel} yet.`}</h3>
      <p>{unavailable ? result.errorCode === "not_configured" ? "The directory is not configured for this deployment." : "The directory is temporarily unavailable. Refresh to try again." : emptyDescription}</p>
      {unavailable ? <button type="button" className="button button-outline" onClick={() => window.location.reload()}>Refresh</button> : null}
    </div>
  );
}
