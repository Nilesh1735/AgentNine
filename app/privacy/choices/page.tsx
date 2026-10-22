import { AnalyticsPrivacyChoices } from "@/components/AnalyticsPrivacyChoices";
import { createPublicPageMetadata } from "@/lib/seo";

export const metadata = {
  ...createPublicPageMetadata({
  title: "Privacy choices",
  description: "Review or change optional analytics, session replay, and marketing choices on AgentNine.",
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
          Google Analytics and Cortality session replay are grouped under Analytics. Meta Pixel is
          grouped under Marketing. You can enable either category independently; essential site
          storage remains active. The directory works without optional services. Withdrawing
          consent stops new events and requests the applicable provider consent updates. Existing
          cookies held by these providers are not automatically removed. Existing first-party
          analytics records collected before this change remain in Supabase; no new first-party
          event records are being collected.
        </p>
        <AnalyticsPrivacyChoices />
      </div>
    </main>
  );
}
