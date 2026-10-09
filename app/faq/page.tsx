import Link from "next/link";
import { FaqDirectory } from "@/components/FaqDirectory";
import { faqGroups } from "@/lib/faq";
import { serializeJsonLd } from "@/lib/json-ld";

export const metadata = {
  title: "Listings, setup, and verification",
  description: "Answers about agent submissions, recorded checks, setup details, and what a verification mark means.",
  alternates: { canonical: "/faq" },
};

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
