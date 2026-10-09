"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main id="main-content" className="page-shell"><div className="container empty-state"><p className="eyebrow">Temporary problem</p><h1>This page could not load.</h1><p>Try again, or search the directory for an agent.</p><div className="hero-actions"><button type="button" className="button button-dark" onClick={() => reset()}>Try again</button><a href="/search" className="button button-outline">Search agents</a></div></div></main>;
}
