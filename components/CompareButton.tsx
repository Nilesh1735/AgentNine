"use client";

import Link from "next/link";
import ArrowRight from "reicon-react/icons/ArrowRight";
import { MAX_COMPARE_AGENTS, normalizeCompareSlugs, toggleCompareSlug } from "@/lib/compare";
import { trackEvent } from "@/lib/analytics";
import { updateVisitorPreferences, useVisitorPreferences } from "@/lib/visitor-preferences";

export function CompareButton({ slug }: { slug: string }) {
  const { preferences } = useVisitorPreferences();
  const slugs = normalizeCompareSlugs(preferences.compareSlugs ?? []);
  const selected = slugs.includes(slug);

  async function toggle() {
    const next = toggleCompareSlug(slugs, slug);
    if (!selected && slugs.length >= MAX_COMPARE_AGENTS) return;
    try {
      await updateVisitorPreferences({ compareSlugs: next });
    } catch (error) {
      console.error("Comparison selection could not be saved", error);
      return;
    }
    trackEvent("comparison_changed", { slug, action: selected ? "removed" : "added", selectionCount: next.length });
  }

  const query = slugs.join(",");
  return (
    <span className="compare-control">
      <button type="button" className={`button button-outline compare-button${selected ? " is-selected" : ""}`} onClick={() => void toggle()} aria-pressed={selected} disabled={!selected && slugs.length >= MAX_COMPARE_AGENTS}>
        {selected ? "In compare" : "Compare"}
      </button>
      {slugs.length > 1 ? <Link className="text-link compare-link" href={`/compare?agents=${encodeURIComponent(query)}`}>View comparison <ArrowRight size={14} aria-hidden="true" /></Link> : null}
    </span>
  );
}
