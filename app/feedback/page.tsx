import { SiteFeedbackForm } from "@/components/SiteFeedbackForm";
import { createPublicPageMetadata } from "@/lib/seo";

export default function FeedbackPage() {
  return (
    <main id="main-content" className="page-shell">
      <div className="container feedback-page">
        <h1>Share feedback about AgentNine.</h1>
        <p className="feedback-page-intro">
          Tell us about your experience using AgentNine. What worked well, and what could be better?
        </p>
        <SiteFeedbackForm />
      </div>
    </main>
  );
}

export const metadata = {
  ...createPublicPageMetadata({
    title: "Send Feedback to AgentNine's AI Agent Directory",
    description: "Send feedback about using AgentNine. Public display requires your permission and team approval.",
    path: "/feedback",
  }),
  robots: { index: true, follow: true },
};
