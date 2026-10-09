function Block({ className = "" }: { className?: string }) {
  return <span className={`route-skeleton-block ${className}`} aria-hidden="true" />;
}

function CardSkeleton() {
  return (
    <div className="agent-card route-skeleton-card" aria-hidden="true">
      <div className="route-skeleton-card-meta"><Block /><Block /></div>
      <Block className="route-skeleton-card-title" />
      <Block className="route-skeleton-card-copy" />
      <Block className="route-skeleton-card-copy route-skeleton-card-copy-short" />
      <div className="route-skeleton-card-footer"><Block /><Block /></div>
    </div>
  );
}

export function HomeCatalogLoadingSkeleton() {
  return (
    <div className="route-skeleton route-skeleton-home" aria-busy="true">
      <span className="sr-only" role="status">Loading directory records</span>
      <section className="container route-skeleton-home-preview" aria-hidden="true">
        <div className="route-skeleton-preview-heading"><Block /><Block className="route-skeleton-preview-link" /></div>
        <div className="route-skeleton-preview-track">
          {[0, 1, 2].map((item) => (
            <div className="agent-ring-card route-skeleton-ring-card" key={item}>
              <div className="route-skeleton-card-meta"><Block /><Block /></div>
              <Block className="route-skeleton-card-title" />
              <Block className="route-skeleton-card-copy" />
              <Block className="route-skeleton-card-copy route-skeleton-card-copy-short" />
              <div className="route-skeleton-card-footer"><Block /><Block /></div>
            </div>
          ))}
          <div className="route-skeleton-ring-center"><Block /></div>
        </div>
      </section>
      <section className="category-band route-skeleton-home-categories" aria-hidden="true">
        <div className="container">
          <header className="route-skeleton-heading">
            <Block className="route-skeleton-eyebrow" />
            <Block className="route-skeleton-title" />
          </header>
          <div className="route-skeleton-category-links">{[0, 1, 2, 3].map((item) => <div key={item}><Block /><Block /><Block /></div>)}</div>
        </div>
      </section>
      <section className="section recent-section route-skeleton-home-recent" aria-hidden="true">
        <div className="container">
          <div className="route-skeleton-section-heading"><Block /><Block className="route-skeleton-preview-link" /></div>
          <div className="recent-grid">{[0, 1, 2, 3].map((item) => <CardSkeleton key={item} />)}</div>
        </div>
      </section>
    </div>
  );
}

export function HomeHeroLoadingSkeleton() {
  return (
    <section className="catalog-cover gallery-cover route-skeleton-home-hero" aria-busy="true">
      <span className="sr-only" role="status">Loading featured agents</span>
      <div aria-hidden="true">
        <div className="route-skeleton-home-hero-title"><Block /><Block /></div>
        <div className="route-skeleton-home-hero-deck">
          {Array.from({ length: 9 }, (_, index) => <Block key={index} />)}
        </div>
      </div>
    </section>
  );
}
