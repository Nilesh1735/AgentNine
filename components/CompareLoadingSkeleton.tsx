"use client";

import { useSyncExternalStore } from "react";

function Block({ className = "" }: { className?: string }) {
  return <span className={`route-skeleton-block ${className}`} aria-hidden="true" />;
}

function subscribeToSearch() {
  return () => {};
}

function getAgentCountFromSearch() {
  const slugs = new Set(
    new URLSearchParams(window.location.search)
      .get("agents")
      ?.split(",")
      .filter((slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) ?? [],
  );
  return Math.min(slugs.size, 3);
}

export function CompareLoadingSkeleton() {
  const agentCount = useSyncExternalStore(subscribeToSearch, getAgentCountFromSearch, () => 0);

  return (
    <main id="main-content" className="page-shell route-skeleton route-skeleton-compare" aria-busy="true">
      <div className="container compare-page">
        <header className="route-skeleton-heading">
          <Block className="route-skeleton-eyebrow" />
          <Block className="route-skeleton-title" />
        </header>
        {agentCount >= 2 ? (
          <>
            <div className="route-skeleton-compare-fit"><Block /><Block /></div>
            <div className="route-skeleton-compare-table">
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index}>
                  <Block />
                  {Array.from({ length: agentCount }, (_, item) => <Block key={item} />)}
                </div>
              ))}
            </div>
          </>
        ) : (
          <section className="compare-empty route-skeleton-compare-empty" aria-hidden="true">
            <Block className="route-skeleton-compare-empty-heading" />
            <Block className="route-skeleton-compare-empty-copy" />
            <Block className="route-skeleton-submit" />
          </section>
        )}
      </div>
    </main>
  );
}
