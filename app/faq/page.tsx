import Link from "next/link";
import { FaqDirectory } from "@/components/FaqDirectory";
import { faqGroups } from "@/lib/faq";
import { serializeJsonLd } from "@/lib/json-ld";
import { createPublicPageMetadata } from "@/lib/seo";

export const metadata = createPublicPageMetadata({
  title: "AI agent directory FAQ: setup and verification",
  description: "Answers about AI-agent listings, setup guides, source details, recorded checks, and what AgentNine verification marks mean.",
  path: "/faq",
});

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqGroups.flatMap(({ questions }) =>
      questions.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    ),
  };

  return (
    <main id="main-content" className="page-shell faq-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <div className="container faq-directory">
        <header className="faq-directory-heading">
          <h1>Listings, setup, and verification</h1>
          <p>
            Answers about AgentNine, its review process, and the information shown on each listing.
            If your question is not covered, <Link href="/contact">contact us</Link>.
          </p>
        </header>
        <FaqDirectory groups={faqGroups} />
      </div>
    </main>
  );
}
