import { createPublicPageMetadata } from "@/lib/seo";

export const metadata = createPublicPageMetadata({
  title: "Refund policy",
  description: "AgentNine does not currently sell subscriptions, downloads, or paid services. There are no charges to refund.",
  path: "/refunds",
});

export default function RefundsPage() {
  return <main id="main-content" className="page-shell"><div className="container prose-page"><p className="eyebrow">Legal</p><h1>Refund policy.</h1><p>AgentNine does not currently sell subscriptions, downloads, or paid services. There are no charges to refund.</p><p>If paid features are introduced, this page will be updated before payment is accepted.</p></div></main>;
}
