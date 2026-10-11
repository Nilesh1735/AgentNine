import Link from "next/link";
import { createPublicPageMetadata } from "@/lib/seo";
import { legalConfig } from "@/lib/legal-config";

export const metadata = createPublicPageMetadata({
  title: "Cookies and preferences",
  description: "How AgentNine uses cookies and stores preferences in Supabase.",
  path: "/cookies",
});

export default function CookiesPage() {
  return (
    <main id="main-content" className="page-shell">
      <div className="container prose-page">
        <p className="eyebrow">Legal</p>
        <h1>Cookies and preferences</h1>
        <p>
          AgentNine does not use advertising cookies. Optional analytics is off unless you choose
          “Allow analytics”. Preferences are stored in Supabase rather than localStorage or
          sessionStorage.
        </p>

        <h2>Necessary cookies</h2>
        <p>
          The visitor cookie <code>{legalConfig.visitorCookieName}</code> is HttpOnly, lasts for up
          to one year, and associates theme, comparison list, setup progress, recent agents, analytics
          choice, and feedback responses with a random visitor identifier. Clearing it in your
          browser does not delete the related database record. Supabase authentication cookies
          beginning with <code>sb-</code> help maintain sign-in and last{" "}
          {legalConfig.authCookieLifetime}. These cookies are not used for advertising.
        </p>

        <h2>Optional analytics</h2>
        <p>
          If you allow analytics, AgentNine records limited usage events and may retain campaign
          attribution. Declining analytics disables event collection and clears the stored analytics
          session identifier and attribution. Your other preferences continue to work.
        </p>

        <p>
          For details about preference retention, privacy requests, and changing your analytics
          choice, see the <Link className="text-link" href="/privacy">Privacy policy</Link> or go
          directly to <Link className="text-link" href="/privacy/choices">Privacy choices</Link>.
        </p>
      </div>
    </main>
  );
}
