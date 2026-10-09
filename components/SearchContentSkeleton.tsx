function Block({ className = "" }: { className?: string }) {
  return <span className={`route-skeleton-block ${className}`} aria-hidden="true" />;
}

export function SearchContentSkeleton({ announce = true }: { announce?: boolean }) {
  return (
    <div
      className="route-skeleton route-skeleton-search-content"
      {...(announce ? { role: "status" as const, "aria-label": "Loading search controls and results" } : { "aria-hidden": true as const })}
    >
      <div className="route-skeleton-search-input"><Block /><Block className="route-skeleton-search-shortcut" /></div>
      <Block className="route-skeleton-search-scope" />
      <div className="route-skeleton-search-toolbar">
        <div className="route-skeleton-search-filter-group">{[0, 1, 2, 3].map((item) => <Block key={item} />)}</div>
        <Block className="route-skeleton-search-sort" />
      </div>
      <div className="route-skeleton-search-meta"><Block /><Block /></div>
      <div className="route-skeleton-search-results">
        {[0, 1, 2, 3].map((item) => (
          <div className="route-skeleton-result" key={item}>
            <div className="route-skeleton-result-main"><Block /><Block /><Block /></div>
            <div className="route-skeleton-result-side"><Block /><Block /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
