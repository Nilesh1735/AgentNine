import Link from "next/link";
import { createPublicPageMetadata } from "@/lib/seo";
import { legalConfig } from "@/lib/legal-config";

export const metadata = createPublicPageMetadata({
  title: "Cookies and preferences",
  description: "How AgentNine uses necessary storage and optional analytics, session replay, and marketing services.",
  path: "/cookies",
});

export default function CookiesPage() {
  return (
    <main id="main-content" className="page-shell">
      <div className="container prose-page">
        <p className="eyebrow">Legal</p>
        <h1>Cookies and preferences</h1>
        <p>
          Google Analytics and Cortality session replay remain off unless you enable Analytics.
          Meta Pixel remains off unless you enable Marketing. These services are not loaded before
          you save the applicable choice. Preferences are stored in Supabase rather than
          localStorage or sessionStorage.
        </p>

        <h2>Necessary cookies</h2>
        <p>
          The visitor cookie <code>{legalConfig.visitorCookieName}</code> is HttpOnly, lasts for up
          to one year, and associates theme, comparison list, setup progress, recent agents,
          optional analytics and marketing choices, and feedback responses with a
          random visitor identifier. Clearing it in your
          browser does not delete the related database record. Supabase authentication cookies
          beginning with <code>sb-</code> help maintain sign-in and last{" "}
          {legalConfig.authCookieLifetime}. These cookies are not used for advertising.
        </p>

        <h2>Analytics and session replay</h2>
        <p>
          If you enable Analytics, Google Analytics measures page views and selected interactions
          using first-party cookies such as <code>_ga</code> and <code>_ga_*</code>. The cookie
          lifetime is configured to six months and is not extended on each visit. Page paths are
          sent without query strings; only <code>utm_source</code>, <code>utm_medium</code>, and{" "}
          <code>utm_campaign</code> may be included. Search terms are not sent. Declining or
          withdrawing Analytics consent stops AgentNine from sending page views and selected
          interactions; a consent-state update is sent to Google and may involve a limited
          cookieless request. Cookies already stored by Google are not automatically cleared when
          consent is withdrawn; you can remove them through your browser settings.
        </p>
        <p>
          Cortality session replay is part of Analytics and loads only after you enable that
          category. It is restricted to the public content pages listed in the{" "}
          <Link className="text-link" href="/privacy">Privacy policy</Link>, only for signed-out
          visitors. Query strings are allowed on Search, Compare, Contact, and Join, and their
          contents may be visible to Cortality. Fragments are excluded. The vendor says it records
          mouse, scroll, and click positions, page-layout images, and page HTML, while blanking typed
          text and form values. AgentNine has not independently verified that behavior. Cortality
          does not load on account, admin, authentication, editor, privacy-choice, or other
          non-allowlisted pages.
        </p>

        <h2>Marketing</h2>
        <p>
          If you enable Marketing, AgentNine loads Meta Pixel ID <code>927600866897675</code> and
          sends a PageView event on eligible public pages. It does not send pageviews from private
          or authentication pages, the search page, URLs containing
          non-campaign query parameters, or URLs with fragments. Campaign parameters are limited
          to <code>utm_source</code>, <code>utm_medium</code>, and <code>utm_campaign</code>.
          Meta may receive page and browser/device information, network information such as your IP
          address, and cookie or similar identifier data under its own terms. The Pixel does not
          load unless Marketing is enabled in your current privacy choices. If you decline or
          withdraw Marketing consent, AgentNine stops sending PageView events and sends a
          consent-revocation command when the Pixel was already initialized. Cookies already stored
          by Meta are not automatically removed; remove them through your browser settings if desired.
        </p>

        <p>
          For details about preference retention, privacy requests, and changing your Analytics or
          Marketing choices, see the <Link className="text-link" href="/privacy">Privacy policy</Link>{" "}
          or go directly to <Link className="text-link" href="/privacy/choices">Privacy choices</Link>.
        </p>
      </div>
    </main>
  );
}
