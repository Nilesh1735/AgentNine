"use client";

import Link from "next/link";

export default function SearchError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main-content" className="page-shell">
      <div className="container empty-state">
        <p className="eyebrow">Directory unavailable</p>
        <h1>Search could not finish loading.</h1>
        <p>The directory search encountered a temporary rendering problem. Your filters were not applied.</p>
        <div className="hero-actions">
          <button type="button" className="button button-dark" onClick={() => reset()}>Try again</button>
          <Link href="/" className="button button-outline">Back home</Link>
        </div>
      </div>
    </main>
  );
}
