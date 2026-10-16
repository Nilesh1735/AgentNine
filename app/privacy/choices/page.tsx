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
          Optional Google Analytics measures page views and selected directory interactions only
          after you allow it. The directory works without it, and declining does not affect your
          other preferences. Withdrawing consent sends Google an updated consent state, which may
          involve a limited cookieless request; AgentNine then stops sending page views and selected
          interactions. Existing first-party analytics records collected before this change remain
          in Supabase; no new first-party event records are being collected. Saving a new choice
          also clears older anonymous analytics session and campaign values from visitor preferences.
        </p>
        <AnalyticsPrivacyChoices />
      </div>
    </main>
  );
}
