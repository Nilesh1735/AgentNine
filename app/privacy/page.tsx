import Link from "next/link";
import { createPublicPageMetadata } from "@/lib/seo";

export const metadata = createPublicPageMetadata({
  title: "Privacy policy",
  description: "How AgentNine handles account, feedback, analytics, and contact information.",
  path: "/privacy",
});

export default function PrivacyPage() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return (
    <main id="main-content" className="page-shell">
      <div className="container prose-page">
        <p className="eyebrow">Legal</p>
        <h1>Privacy policy</h1>
        <p>Last updated: September 28, 2026</p>
        <h2>What AgentNine does</h2>
        <p>
          AgentNine is a public directory of AI-agent projects. You can browse listings,
          search the directory, read setup notes, and follow links to external repositories without
          creating an AgentNine account.
        </p>

        <h2>Information you provide</h2>
        <p>
          If you create an account, the browser form handles your password and sends it to Supabase
          Auth for sign-in or registration. AgentNine&apos;s application database does not store your
          password. Supabase Auth processes it to provide the account service.
        </p>
        <p>
          Contact and join forms send your name, email address, message, and any optional profile or
          source links you provide. When the relevant services are configured, the application can
          record submissions in Supabase and forward them to a configured contact service. A
          submission may be stored even when email forwarding is unavailable.
        </p>
        <p>
          If you vote on a guide, the browser stores a random respondent identifier and the database
          stores the vote against that identifier and guide. The identifier is held in a necessary,
          server-managed cookie and is not an account identifier.
        </p>

        <h2>Information collected automatically</h2>
        <p>
          Optional analytics is off until you allow it. If enabled, the application sends event
          names, page paths without query strings, a random session identifier, allowlisted event
          details, and optional campaign attribution. Raw search text is not
          intentionally included in analytics events or page paths.
        </p>
        <p>
          To protect the service, request IP addresses may be processed by the hosting and rate-limit
          infrastructure. Admin sign-in outcomes and the available client IP are also written to a
          restricted Supabase security log. The configured shared rate limiter stores a
          cryptographic hash of its rate-limit key rather than the raw IP address or email address.
        </p>
        <p>
          Theme choice, analytics consent and related identifiers, comparison selection, setup
          progress, and recent agent names are stored in Supabase against a random visitor identifier.
          The identifier is held in a necessary, HttpOnly cookie so preferences can be kept separate
          between browsers without creating an account. Supabase authentication may also use cookies
          to maintain signed-in sessions. AgentNine does not use localStorage or sessionStorage for
          these preferences.
        </p>

        <h2>Why we use information</h2>
        <ul>
          <li>To operate accounts and requested site features;</li>
          <li>To review and respond to contact or contribution submissions;</li>
          <li>To prevent abuse and protect account and service security;</li>
          <li>To display aggregate helpfulness feedback; and</li>
          <li>To understand directory usage when optional analytics is enabled.</li>
        </ul>

        <h2>Service providers and external projects</h2>
        <p>
          The application uses Supabase integration points for database and authentication
          features, and can use Upstash for shared rate limiting and Resend or a configured endpoint
          for contact delivery. The providers actually processing data depend on the deployed
          configuration. Hosting providers may also process request data to deliver and protect the
          site. Agent pages link to independent third-party projects that apply their own privacy
          practices.
        </p>

        <h2>Retention and deletion</h2>
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
          succeeds, deletes the authentication record. The database function determines which
          contribution records are removed. Records held by contact-delivery providers may remain
          under their own retention settings. Anonymous analytics, feedback identifiers, visitor
          preferences, and admin security logs are not part of that account-deletion request and
          follow their separate retention settings. Contact the address below for privacy requests
          concerning those records.
        </p>

        <h2>Age and changes</h2>
        <p>
          AgentNine is a general technology directory, not a service designed specifically for
          children. This policy may change when the product, providers, or data practices change.
        </p>

        <h2>Contact</h2>
        <p>
          {contactEmail
            ? <>Privacy questions and requests can be sent to <a className="text-link" href={`mailto:${contactEmail}`}>{contactEmail}</a>.</>
            : "A privacy contact email is not currently configured."}
        </p>
      </div>
    </main>
  );
}
