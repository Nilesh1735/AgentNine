import { Suspense } from "react";
import Link from "next/link";
import { CatalogBackground } from "@/components/CatalogBackground";
import { HomeCatalogSections } from "@/components/HomeCatalogSections";
import { HomeCatalogLoadingSkeleton } from "@/components/HomeLoadingSkeleton";
import { HomeFaqAccordion } from "@/components/HomeFaqAccordion";
import { ProfileAvatars } from "@/components/ProfileAvatars";
import { serializeJsonLd } from "@/lib/json-ld";
import { createPublicPageMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "AgentNine",
        description: "Compare AI agent projects by source, setup requirements, and documented access.",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        url: SITE_URL,
        name: "AgentNine",
        logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.svg` },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <main id="main-content">
        <section className="catalog-cover gallery-cover">
          <CatalogBackground />
        </section>
        <Suspense fallback={<HomeCatalogLoadingSkeleton />}>
          <HomeCatalogSections />
        </Suspense>
        <section className="section standards-section new-standards">
          <div className="container">
            <div className="standards-intro">
              <p className="eyebrow">What each record includes</p>
              <h2>Check source, setup, and access.</h2>
              <p>Each listing keeps those details separate so you can review them before a first run.</p>
            </div>
            <div className="standards-list">
              <div className="feature-item"><span className="feature-number">A</span><h3>Source</h3><p>Open the upstream repository and review the release or commit behind the record.</p></div>
              <div className="feature-item"><span className="feature-number">B</span><h3>Setup</h3><p>Check installation commands, environment requirements, and first-run guidance.</p></div>
              <div className="feature-item"><span className="feature-number">C</span><h3>Access</h3><p>Review network, file, memory, port, and provider details before local execution.</p></div>
            </div>
          </div>
        </section>
        <section className="section faq-section">
          <div className="container faq-layout">
            <div>
              <p className="eyebrow">FAQ</p>
              <h2>Questions about listings and setup</h2>
              <p>See what a verification mark means, where listing details come from, and what to check before running a project.</p>
            </div>
            <HomeFaqAccordion />
          </div>
        </section>
        <section className="section founder-invite" aria-labelledby="founder-invite-title">
          <div className="container founder-invite-layout">
            <div>
              <p className="eyebrow">The people behind AgentNine</p>
              <h2 id="founder-invite-title">Build AgentNine with us.</h2>
              <p>
                Help make AI agent projects easier to evaluate.{" "}
                <Link href="/join">Contribute to AgentNine.</Link>
              </p>
            </div>
            <div className="founder-invite-avatars">
              <ProfileAvatars size={76} />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export const metadata = createPublicPageMetadata({
  title: "Open-Source AI Agents: Setup & Access",
  description: "Find open-source AI agent projects. Compare source repositories, setup guidance, requirements, and documented access before you run them.",
  path: "/",
});
