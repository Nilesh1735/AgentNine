import type { Metadata } from "next";
import Link from "next/link";
import ArrowRight from "reicon-react/icons/ArrowRight";
import { createPublicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Trust and methodology",
  description: "How AgentNine records verification evidence, freshness, and uncertainty.",
  path: "/methodology",
});

export default function MethodologyPage() {
  return (
    <main id="main-content" className="page-shell">
      <div className="container trust-page">
        <div className="page-heading">
          <p className="eyebrow">Trust and methodology</p>
          <h1>Evidence, freshness, and clear limits.</h1>
          <p>AgentNine separates what was checked from what is only visible in the upstream repository. Missing data stays missing.</p>
        </div>
        <section className="trust-methodology-grid" aria-label="AgentNine methodology">
          <article className="trust-methodology-card">
            <h2>Verification states</h2>
            <p><strong>Verified</strong> means all five checklist items have recorded evidence, repository freshness is current, and no later upstream change is recorded.</p>
            <p><strong>Partially verified</strong> means only some of those items are recorded. A record without evidence is left as unverified rather than treated as tested.</p>
          </article>
          <article className="trust-methodology-card">
            <h2>Freshness signals</h2>
            <p>A repository metadata check date is used when available. Otherwise, freshness uses the latest recorded upstream commit. A stale flag or a date older than 180 days marks the record <strong>Needs review</strong>, including records with all five checklist items complete.</p>
            <p>The setup-review date describes when checklist evidence was recorded; it does not determine repository freshness.</p>
          </article>
          <article className="trust-methodology-card">
            <h2>What this is not</h2>
            <p>A score is not a safety certification, security audit, endorsement, or guarantee that upstream behavior has stayed unchanged.</p>
            <p>Read the source repository, license, permissions, provider terms, and current issues before running an agent.</p>
          </article>
        </section>
        <div className="trust-page-actions">
          <Link className="text-link" href="/search">Browse agents <ArrowRight size={14} aria-hidden="true" /></Link>
          <Link className="text-link" href="/contact">Suggest a correction <ArrowRight size={14} aria-hidden="true" /></Link>
        </div>
      </div>
    </main>
  );
}
