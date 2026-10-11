import Link from "next/link";
import { createPublicPageMetadata } from "@/lib/seo";
import { legalConfig } from "@/lib/legal-config";

export const metadata = createPublicPageMetadata({
  title: "Privacy policy",
  description: "How AgentNine handles account, feedback, analytics, and contact information.",
  path: "/privacy",
});

const processorRows = [
  { provider: "Supabase", purpose: "Database, authentication, and optional analytics storage" },
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
          If you vote on a guide, the database stores the vote against a random respondent identifier
          and the guide. That identifier is held in a server-managed cookie and is not an account
          identifier.
        </p>

        <h2>Information collected automatically</h2>
        <p>
          Optional analytics is off until you allow it. If enabled, the application may send event
          names, page paths without query strings, a random session identifier, allowlisted event
          details, and campaign attribution. Raw search text is not intentionally included in
          analytics events or page paths.
        </p>
        <p>
          Hosting and rate-limit infrastructure may process request IP addresses. Admin sign-in
          outcomes and the available client IP are written to a restricted Supabase security log.
          The configured shared rate limiter stores a cryptographic hash of its rate-limit key
          rather than the raw IP address or email address.
        </p>
        <p>
          Theme choice, analytics consent and related identifiers, comparison selection, setup
          progress, and recent agent names are stored in Supabase against a random visitor identifier.
          The identifier is held in an HttpOnly cookie. Supabase authentication may also use cookies
          to maintain signed-in sessions. AgentNine does not use localStorage or sessionStorage for
          these preferences.
        </p>

        <h2>Why we use information</h2>
        <ul>
          <li>To create and maintain accounts and provide requested account features;</li>
          <li>To respond to contact messages and review contributions;</li>
          <li>To protect accounts and the service and prevent abuse;</li>
          <li>To show aggregate guide feedback and improve directory information; and</li>
          <li>To understand directory usage through optional analytics, if you allow it.</li>
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
          Some providers may process information outside India.
        </p>
        <p>
          Agent pages link to independent third-party projects. Those projects have their own
          privacy practices.
        </p>

        <h2 id="retention-and-deletion">Retention and deletion</h2>
        <p>
          The application does not set automatic deletion periods for contact submissions, analytics
          events, feedback, or admin security logs. How long those records remain available depends
          on the database and service-provider retention settings.
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
          providers may retain their own copies under their own policies. Anonymous analytics, feedback identifiers, visitor preferences,
          and admin security logs are not part of that account-deletion request. To request access
          to, correction of, or deletion of other information, contact us using the details in the
          contact section.
        </p>

        <h2>Your privacy choices and rights</h2>
        <p>
          You can withdraw analytics consent at any time on the{" "}
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
