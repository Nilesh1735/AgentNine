import { AnalyticsPrivacyChoices } from "@/components/AnalyticsPrivacyChoices";
import { createPublicPageMetadata } from "@/lib/seo";

export const metadata = {
  ...createPublicPageMetadata({
  title: "Privacy choices",
  description: "Review or change optional analytics and session replay choices on AgentNine.",
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
          Optional Google Analytics, Meta Pixel, and Cortality session replay are enabled only
          after you allow them. Google Analytics measures page views and selected directory interactions. Meta Pixel sends
          PageView events on eligible public pages only; it is not used on private or authentication
          pages or to send search text. Cortality records replay data on an allowlist of public pages,
          including search, comparison, contact, and join pages. The directory works without these
          services, and declining
          does not affect your other preferences. Withdrawing consent stops new events and sends
          Google an updated consent state and a Meta consent-revocation command when applicable.
          Existing cookies held by these providers are not automatically removed. Existing
          first-party analytics records collected before this change remain in Supabase; no new
          first-party event records are being collected. Your Allow or Decline choice applies to
          all three services.
        </p>
        <AnalyticsPrivacyChoices />
      </div>
    </main>
  );
}
