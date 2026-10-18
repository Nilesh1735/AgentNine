"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import ArrowRight from "reicon-react/icons/ArrowRight";
import { MAX_COMPARE_AGENTS, normalizeCompareSlugs, toggleCompareSlug } from "@/lib/compare";
import { trackEvent } from "@/lib/analytics";
import { updateVisitorPreferences, useVisitorPreferences } from "@/lib/visitor-preferences";

export function CompareButton({ slug }: { slug: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { preferences } = useVisitorPreferences();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const isComparePage = pathname === "/compare";
  const slugs = normalizeCompareSlugs(
    isComparePage
      ? (searchParams.get("agents") ?? "").split(",").filter(Boolean)
      : preferences.compareSlugs ?? [],
  );
  const selected = slugs.includes(slug);

  async function toggle() {
    const next = toggleCompareSlug(slugs, slug);
    if (!selected && slugs.length >= MAX_COMPARE_AGENTS) return;
    setPending(true);
    setError("");
    if (isComparePage) {
      trackEvent("comparison_changed", { slug, action: selected ? "removed" : "added", selectionCount: next.length });
      const query = next.length ? `?agents=${encodeURIComponent(next.join(","))}` : "";
      router.replace(`/compare${query}`, { scroll: false });
    }
    try {
      await updateVisitorPreferences({ compareSlugs: next });
    } catch (error) {
      console.error("Comparison selection could not be saved", error);
      setError("Could not update your comparison. Please try again.");
      setPending(false);
      if (!isComparePage) return;
    }
    if (!isComparePage) trackEvent("comparison_changed", { slug, action: selected ? "removed" : "added", selectionCount: next.length });
    setPending(false);
  }

  const query = slugs.join(",");
  return (
    <span className="compare-control">
      <button type="button" className={`button button-outline compare-button${selected ? " is-selected" : ""}`} onClick={() => void toggle()} aria-pressed={selected} disabled={pending || (!selected && slugs.length >= MAX_COMPARE_AGENTS)}>
        {selected ? "In compare" : "Compare"}
      </button>
      {error ? <span className="compare-button-error" role="status">{error}</span> : null}
      {!isComparePage && slugs.length > 1 ? <Link className="text-link compare-link" href={`/compare?agents=${encodeURIComponent(query)}`}>View comparison <ArrowRight size={14} aria-hidden="true" /></Link> : null}
    </span>
  );
}
