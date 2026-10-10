import { AnalyticsPrivacyChoices } from "@/components/AnalyticsPrivacyChoices";
import { createPublicPageMetadata } from "@/lib/seo";

export const metadata = {
  ...createPublicPageMetadata({
  title: "Privacy choices",
  description: "Review or change whether AgentNine may collect optional analytics.",
  path: "/privacy/choices",
  }),
  robots: { index: false, follow: true },
};

export default function PrivacyChoicesPage() {
  return (
    <main id="main-content" className="page-shell">
      <div className="container prose-page">
        <p className="eyebrow">Privacy</p>
        <h1>Privacy choices</h1>
        <p>
          Optional analytics helps us understand which pages are useful. The directory works
          without it, and declining does not affect your other preferences.
        </p>
        <AnalyticsPrivacyChoices />
      </div>
    </main>
  );
}
