import Link from "next/link";

export const metadata = {
  title: "Terms of service",
  description: "Terms for using AgentNine and reviewing listed AI-agent projects.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return (
    <main id="main-content" className="page-shell">
      <div className="container prose-page">
        <p className="eyebrow">Legal</p>
        <h1>Terms of service</h1>
        <p>Last updated: September 28, 2026</p>
        <p className="legal-notice">
          <strong>Pre-launch review required.</strong> This is a product-specific draft, not legal
          advice. The operator&apos;s legal identity, governing law, liability terms, required consumer
          notices, and dispute process depend on facts not established in the repository. Have
          qualified counsel review these terms for the business and locations where the service is
          offered before publication.
        </p>

        <h2>1. Acceptance of terms</h2>
        <p>
          By accessing or using AgentNine and its related features, you agree to these terms and the
          <Link className="text-link" href="/privacy"> Privacy policy</Link>. If you do not agree,
          do not use the service.
        </p>

        <h2>2. Description of the service</h2>
        <p>
          AgentNine is a public directory of AI-agent projects. It provides listings,
          editorial context, setup notes, recorded verification information, search and comparison
          tools, and links to upstream sources. Public browsing does not require an account.
        </p>

        <h2>3. Projects, licenses, and use</h2>
        <p>
          AgentNine does not grant a license to third-party projects listed in the directory.
          Software, names, logos, documentation, and other materials remain subject to their
          respective owners&apos; terms and licenses. Before downloading or running a project, review
          its upstream license, security posture, dependencies, permissions, and any applicable
          provider terms. You are responsible for your use of external software.
        </p>
        <p>
          Verification scores, dates, and evidence describe checks recorded at a point in time. They
          are not safety certifications, endorsements, security audits, warranties, or guarantees of
          compatibility or performance. Listings, instructions, prices, dependencies, and links may
          be incomplete, outdated, or unavailable.
        </p>

        <h2>4. Intellectual property</h2>
        <p>
          AgentNine branding and original editorial content belong to their respective owners unless
          otherwise stated. Listing a third-party project does not imply its endorsement or
          affiliation with AgentNine. Do not use AgentNine&apos;s name or branding to suggest an
          endorsement without permission.
        </p>

        <h2>5. Accounts and submissions</h2>
        <p>
          If you create an account, provide accurate information, protect your credentials, and take
          responsibility for activity performed through it. If you send a correction or contribution,
          you confirm that you may share it for review. You retain ownership of your submission; you
          permit AgentNine to use it to review, respond to, and display the resulting directory
          correction or contribution.
        </p>

        <h2>6. Acceptable use</h2>
        <p>You agree not to use the service to:</p>
        <ul>
          <li>violate applicable law or another person&apos;s rights;</li>
          <li>attempt unauthorized access or disrupt the service or its infrastructure;</li>
          <li>send malicious, misleading, or unlawful submissions; or</li>
          <li>scrape or harvest information in a way that degrades the service for others.</li>
        </ul>

        <h2>7. Availability and changes</h2>
        <p>
          AgentNine may update, remove, archive, or restrict listings and may change or discontinue
          features. The service is provided on an “as available” basis. AgentNine currently offers
          no paid plans or in-app purchases. These terms may be updated; the “Last updated” date
          identifies the latest revision.
        </p>

        <h2>8. Disclaimers and liability</h2>
        <p>
          AgentNine is an informational directory, not a guarantee that a listed project is safe,
          supported, or suitable for your use. Any warranty exclusions, liability limits, governing
          law, venue, or dispute-resolution terms depend on the operator and applicable law. They
          have not been completed here because those facts have not been confirmed; qualified
          counsel must review and finalize this section before launch.
        </p>

        <h2>9. Contact</h2>
        <p>
          {contactEmail
            ? <>Questions about these terms can be sent to <a className="text-link" href={`mailto:${contactEmail}`}>{contactEmail}</a>.</>
            : "A legal contact email has not been configured. Configure NEXT_PUBLIC_CONTACT_EMAIL before launch."}
        </p>
      </div>
    </main>
  );
}
