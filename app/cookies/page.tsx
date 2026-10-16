import Link from "next/link";
import { createPublicPageMetadata } from "@/lib/seo";
import { legalConfig } from "@/lib/legal-config";

export const metadata = createPublicPageMetadata({
  title: "Cookies and preferences",
  description: "How AgentNine uses necessary cookies, stores preferences, and runs opt-in Google Analytics.",
  path: "/cookies",
});

export default function CookiesPage() {
  return (
    <main id="main-content" className="page-shell">
      <div className="container prose-page">
        <p className="eyebrow">Legal</p>
        <h1>Cookies and preferences</h1>
        <p>
          AgentNine does not use advertising cookies. Google Analytics is off unless you choose
          “Allow”. Its tag is not loaded before that choice. Preferences are stored in Supabase
          rather than localStorage or sessionStorage.
        </p>

        <h2>Necessary cookies</h2>
        <p>
          The visitor cookie <code>{legalConfig.visitorCookieName}</code> is HttpOnly, lasts for up
          to one year, and associates theme, comparison list, setup progress, recent agents,
          analytics choice, and feedback responses with a random visitor identifier. Clearing it in your
          browser does not delete the related database record. Supabase authentication cookies
          beginning with <code>sb-</code> help maintain sign-in and last{" "}
          {legalConfig.authCookieLifetime}. These cookies are not used for advertising.
        </p>

        <h2>Optional analytics</h2>
        <p>
          If you allow Google Analytics, it measures page views and selected interactions using
          first-party cookies such as <code>_ga</code> and <code>_ga_*</code>. The cookie lifetime is
          configured to six months and is not extended on each visit. Page paths are sent without
          query strings; only <code>utm_source</code>, <code>utm_medium</code>, and{" "}
          <code>utm_campaign</code> may be included. Search terms are not sent. Declining or
          withdrawing consent stops AgentNine from sending page views and selected interactions;
          a consent-state update is sent to Google and may involve a limited cookieless request.
          Cookies already stored by Google are not automatically cleared when consent is
          withdrawn; you can remove them through your browser settings.
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
