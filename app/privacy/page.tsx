import Link from "next/link";
import { createPublicPageMetadata } from "@/lib/seo";
import { legalConfig } from "@/lib/legal-config";

export const metadata = {
  ...createPublicPageMetadata({
    title: "Privacy policy",
    description: "How AgentNine handles account, contact, feedback, preference, analytics, and session replay information.",
    path: "/privacy",
  }),
  robots: { index: false, follow: true },
};

const processorRows = [
  { provider: "Supabase", purpose: "Database, authentication, preferences, feedback, and account data" },
  { provider: "Google Analytics", purpose: "Optional website measurement, only after you enable Analytics" },
  { provider: "Meta", purpose: "Optional Meta Pixel PageView measurement, only after you enable Marketing" },
  { provider: "Cortality", purpose: "Optional session replay on allowlisted public pages, only after you enable Analytics" },
  { provider: "Google", purpose: "Sign-in provider, when you choose Google sign-in" },
  { provider: "Vercel", purpose: "Website hosting and request delivery" },
  ...(legalConfig.upstashEnabled ? [{ provider: "Upstash", purpose: "Shared rate limiting" }] : []),
  ...(legalConfig.resendEnabled ? [{ provider: "Resend", purpose: "Contact email delivery" }] : []),
];

export default function PrivacyPage() {
  const contact = legalConfig.contactEmail
    ? <a className="text-link" href={`mailto:${legalConfig.contactEmail}`}>{legalConfig.contactEmail}</a>
    : null;

  return (
    <main id="main-content" className="page-shell">
      <div className="container prose-page">
        <p className="eyebrow">Legal</p>
        <h1>Privacy policy</h1>
        <p>Last updated: {legalConfig.lastUpdated}</p>

        <h2>Who operates AgentNine and how to contact us</h2>
        <p>
          AgentNine is operated in India by {legalConfig.operatorName}, who is also the privacy and
          grievance officer. Contact{" "}
          {contact ?? <Link className="text-link" href="/contact">the contact page</Link>}. We
          respond to requests within 30 days, subject to applicable law.
        </p>

        <h2>What AgentNine does</h2>
        <p>
          AgentNine is a public directory of AI-agent projects. You can browse listings, search the
          directory, read setup notes, and follow links to external repositories without creating
          an AgentNine account.
        </p>
        <p>
          AgentNine is not offered to people in the European Economic Area, the United Kingdom, or
          Switzerland.
        </p>

        <h2>Information you provide</h2>
        <p>
          If you create an account or sign in with email and password, your password is sent to
          Supabase Auth. AgentNine&apos;s application database does not store your password. If you
          choose Google sign-in, Google authenticates you and shares your name, email address,
          profile picture, and Google account identifier with Supabase and AgentNine to create or
          access your account.
        </p>
        <p>
          Contact and join forms may collect your name, email address, message, and optional profile
          or source links. The application can store submissions in Supabase and forward them to a
          contact-delivery provider. A submission may be stored even if email
          forwarding is unavailable.
        </p>
        <p>
          The feedback form collects your message and an optional display name. You may submit it
          without permission for public display, in which case it stays private to the AgentNine
          team. If you separately give permission, it can appear on the homepage only after an
          administrator approves it. A display name is shown only when you provide one.
        </p>
        <p>
          If you vote on a guide, the database stores the vote against a random respondent identifier
          and the guide. That identifier is held in a server-managed cookie and is not an account
          identifier.
        </p>

        <h2>Information collected automatically</h2>
        <p>
          Google Analytics 4 is off until you enable the Analytics category. Google Analytics receives
          page views and selected directory interactions, such as agent-guide views, searches and
          filter counts, source-link clicks, saved-agent and comparison actions, and guide feedback
          choices. Page paths and referring paths are sent without query strings; campaign
          parameters are limited to <code>utm_source</code>, <code>utm_medium</code>, and{" "}
          <code>utm_campaign</code>. Same-site referrer paths are sent without query strings;
          external referrers are limited to their origin. Search text, form contents, passwords,
          account details, and private/admin page views are not sent as analytics events. Google may process
          browser/device information, page and event data, cookies or similar identifiers, and
          information used to estimate general location. Google may process information outside
          India under its own terms and privacy documentation. If you withdraw Analytics consent after
          enabling the tag, AgentNine sends Google a consent-state update so it can stop analytics
          storage. Google may process that signal, including a limited cookieless request; AgentNine
          then stops sending page views and selected interaction events.
        </p>
        <p>
          If you enable the Marketing category, Meta Pixel (ID <code>927600866897675</code>)
          receives PageView events on eligible public pages. It is not activated on private or
          authentication pages, the search page, URLs with non-campaign query parameters, or URLs
          with fragments. The Pixel may receive the page URL with limited campaign parameters,
          browser/device information, network information such as an IP address, and cookie or
          similar identifier data. Meta processes this information under its own privacy terms and
          may process it outside India. Declining or withdrawing Marketing consent stops AgentNine
          from sending further PageView events and requests consent revocation from the Pixel;
          cookies already stored by Meta are not automatically deleted.
        </p>
        <p>
          Cortality session replay is included in the Analytics category with Google Analytics, and
          is separate from Marketing. When enabled, AgentNine loads it only for signed-out visitors
          on these public content pages: the home page; agent listings and individual agent pages;
          categories and individual category pages; FAQ; About; methodology; news and published news
          articles; Terms; Privacy; and Cookies on <code>agentnine.pro</code> and{" "}
          <code>www.agentnine.pro</code> only, plus Search, Compare, Contact, and Join. It does not
          load on admin, account, profile, API, authentication, news editor, or privacy-choice
          pages. Query strings are allowed on Search, Compare, Contact, and Join and may be visible
          to Cortality, including search text in the Search URL. The script does not load on other
          pages with query strings or any URL with a fragment. Navigating
          from a tracked page to any other page uses a full page load, and excluded pages also have
          a Content Security Policy that blocks Cortality&apos;s script and data endpoint.
        </p>
        <p>
          Cortality says its replay records mouse, scroll, and click positions, page-layout images,
          and page HTML, while blanking typed text and form values. This includes activity on
          Contact and Join pages. AgentNine has not independently verified the vendor&apos;s capture
          behavior. This includes activity on Contact and Join pages. Do not submit confidential
          information on these pages while session replay is enabled. Cortality may receive the captured session data and process
          it under its own terms. The replay tag is not activated for signed-in visitors, and
          declining or withdrawing permission
          prevents it from being loaded on subsequent eligible pages.
        </p>
        <p>
          Hosting and rate-limit infrastructure may process request IP addresses. Admin sign-in
          outcomes and the available client IP are written to a restricted Supabase security log.
          The configured shared rate limiter stores a cryptographic hash of its rate-limit key
          rather than the raw IP address or email address.
        </p>
        <p>
          Theme choice, optional analytics and marketing choices, comparison selection, setup
          progress, and recent agent names are stored in Supabase against a random visitor identifier.
          The identifier is held in an HttpOnly cookie. Supabase authentication may also use cookies
          to maintain signed-in sessions. AgentNine does not use localStorage or sessionStorage for
          these preferences.
        </p>

        <h2>Why we use information</h2>
        <ul>
          <li>To create and maintain accounts and provide requested account features;</li>
          <li>To respond to contact messages, review contributions, and consider feedback about AgentNine;</li>
          <li>To protect accounts and the service and prevent abuse;</li>
          <li>To show aggregate guide feedback and improve directory information; and</li>
          <li>To understand directory usage through Google Analytics and Cortality session replay, only if you enable Analytics, and Meta Pixel, only if you enable Marketing.</li>
        </ul>

        <h2>Service providers</h2>
        <p>
          We use these providers to operate AgentNine:
        </p>
        <div className="legal-table-wrap">
          <table className="legal-table">
            <thead>
              <tr>
                <th scope="col">Provider</th>
                <th scope="col">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {processorRows.map((row) => (
                <tr key={row.provider}>
                  <td>{row.provider}</td>
                  <td>{row.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Google Analytics data-retention settings are managed in the Google Analytics property and
          are not controlled by this application. Existing first-party analytics event rows
          collected before Google Analytics was enabled remain in Supabase; this application no
          longer adds new rows to that table. The application does not currently configure an
          automatic deletion period for those historical rows.
        </p>
        <p>
          Older visitor-preference records may also contain an anonymous analytics session
          identifier or campaign attribution values collected before this change. AgentNine no
          longer creates or uses those values, and saving new privacy choices clears them.
          Until that happens, they remain subject to the visitor-preference retention described
          below.
        </p>
        <p>Some providers may process information outside India.</p>
        <p>
          Agent pages link to independent third-party projects. Those projects have their own
          privacy practices.
        </p>

        <h2 id="retention-and-deletion">Retention and deletion</h2>
        <p>
          The application does not set automatic deletion periods for contact submissions, feedback,
          admin security logs, or first-party analytics events collected before Google Analytics
          was enabled. Those historical analytics rows remain in Supabase and are no longer
          collected by this application. How long those records remain available depends on the
          database and service-provider retention settings.
        </p>
        <p>
          The application does not set automatic expiration for anonymous visitor preferences.
          Removing the site&apos;s cookies stops that browser from being associated with its existing
          anonymous preferences but does not itself delete their database record. Signed-in users
          can request account deletion from the{" "}
          <Link className="text-link" href="/account/delete">account deletion page</Link>. The
          application asks Supabase to remove contribution data for the account and, if that
          succeeds, deletes the authentication record. A database function determines which
          contribution records are removed. Contact-delivery
          providers may retain their own copies under their own policies. Anonymous analytics,
          guide-feedback identifiers, platform feedback, visitor preferences, and admin security
          logs are not part of that account-deletion request. To request access to, correction of,
          or deletion of other information, including removal of published feedback, contact us
          using the details in the contact section.
        </p>

        <h2>Your privacy choices and rights</h2>
        <p>
          You can change your Analytics and Marketing choices at any time on the{" "}
          <Link className="text-link" href="/privacy/choices">privacy choices page</Link>. Depending
          on applicable law and your location, you may also have rights to request access to,
          correction of, or deletion of personal information, object to or restrict certain
          processing, or complain to the Data Protection Board of India or another competent
          authority, where applicable. Contact us to submit a request. We may need to verify your
          identity. Include the email address you used on AgentNine and what you are asking us to
          do.
        </p>

        <h2>Children</h2>
        <p>
          AgentNine is a general technology directory and is not intended for people under 18. We do
          not knowingly collect personal information from anyone under 18. If you believe someone
          under 18 has provided us personal information, contact us so we can review and address it.
        </p>

        <h2>Security incidents</h2>
        <p>
          If a security incident affects personal information, AgentNine will assess and respond to
          it, including notifying affected people and authorities where applicable law requires.
        </p>

        <h2>Changes</h2>
        <p>
          This policy may change when the product, providers, or data practices change. The date
          above identifies the latest revision.
        </p>
      </div>
    </main>
  );
}
