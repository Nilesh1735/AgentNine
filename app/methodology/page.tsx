import type { Metadata } from "next";
import Link from "next/link";
import ArrowRight from "reicon-react/icons/ArrowRight";
import { createPublicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...createPublicPageMetadata({
    title: "Trust and methodology",
    description: "How AgentNine records verification evidence, freshness, and uncertainty.",
    path: "/methodology",
  }),
  robots: { index: false, follow: true },
};

export default function MethodologyPage() {
  return (
    <main id="main-content" className="page-shell">
      <div className="container trust-page">
        <div className="page-heading">
          <p className="eyebrow">Trust and methodology</p>
          <h1>Evidence, freshness, and clear limits.</h1>
          <p>AgentNine separates what was checked from what is only visible in the project repository. Missing data stays missing.</p>
        </div>
        <section className="trust-methodology-grid" aria-label="AgentNine methodology">
          <article className="trust-methodology-card">
            <h2>Five-step setup verification</h2>
            <p>The 0/5 to 5/5 score tracks AgentNine&apos;s five-step setup verification checklist: reviewing the exact source version, installing dependencies, confirming a model-provider connection, completing a first prompt, and passing a normal-machine run.</p>
            <p>This is a setup and usability review, not a security audit or security certification. <strong>Documented</strong> and <strong>Needs review</strong> describe documentation and repository freshness; archived listings are labeled separately.</p>
          </article>
          <article className="trust-methodology-card">
            <h2>Freshness signals</h2>
            <p>A repository metadata check date is used when available. Otherwise, freshness uses the latest recorded commit to the project repository. A stale flag or a date older than 180 days marks the record <strong>Needs review</strong>.</p>
            <p>The checklist score summarizes the five recorded steps. Repository freshness is tracked separately, and a stale flag or upstream change can still require review.</p>
          </article>
          <article className="trust-methodology-card">
            <h2>What this is not</h2>
            <p>A listing status is not a license determination, safety certification, security audit, endorsement, or guarantee that the project has stayed unchanged.</p>
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
