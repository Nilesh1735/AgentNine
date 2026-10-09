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
        <p className="legal-notice">
          <strong>Pre-launch review required.</strong> This policy is a factual draft based on the
          current repository. Before publishing, confirm the operator&apos;s legal identity,
          applicable jurisdictions, deployed providers, processing locations, and retention periods
          with qualified counsel.
        </p>

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
          source links you provide. When configured, the application records submissions in
          Supabase and forwards them to the configured contact service.
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
          The application is designed to use Supabase for database and authentication services,
          hosting and domain providers for site delivery, a configured external contact/report
          service, and Upstash for shared rate limiting when enabled. The exact provider accounts,
          subprocessors, locations, and enabled services must be confirmed from the production
          deployment before publication. Agent pages link to independent third-party projects that
          apply their own privacy practices.
        </p>

        <h2>Retention and deletion</h2>
        <p>
          The repository does not currently define automatic deletion periods for contact
          submissions, analytics events, feedback, or admin security logs. Their actual retention
          depends on production database and provider settings; set and verify retention schedules
          before launch and update this policy with those periods.
        </p>
        <p>
          The repository does not yet define automatic expiration for anonymous visitor preferences;
          confirm and configure a retention period before launch. Removing the site&apos;s cookies
          stops the browser from being associated with its existing anonymous preferences but does
          not itself delete their database record. Signed-in users can request account deletion from the{" "}
          <Link className="text-link" href="/account/delete">account deletion page</Link>. That
          action removes the authentication record, saved agents, category follows, saved-agent
          history, and contribution submissions associated with the account or its exact email
          address in Supabase. The contact delivery provider may retain a copy under its own
          retention settings. Anonymous analytics, feedback identifiers, visitor preferences, and
          shared-key admin security logs are not linked to the account and are handled under their
          separate retention settings. Contact the address below for separate privacy requests
          concerning those records.
        </p>

        <h2>Age and changes</h2>
        <p>
          AgentNine is a general technology directory and is not directed to children. This policy
          may change when the product, providers, or data practices change.
        </p>

        <h2>Contact</h2>
        <p>
          {contactEmail
            ? <>Privacy questions and requests can be sent to <a className="text-link" href={`mailto:${contactEmail}`}>{contactEmail}</a>.</>
            : "A privacy contact email has not been configured. Configure NEXT_PUBLIC_CONTACT_EMAIL before launch."}
        </p>
      </div>
    </main>
  );
}
