import Link from "next/link";
import { createPublicPageMetadata } from "@/lib/seo";
import { legalConfig } from "@/lib/legal-config";

export const metadata = createPublicPageMetadata({
  title: "Terms of service",
  description: "Terms for using AgentNine and reviewing listed AI-agent projects.",
  path: "/terms",
});

export default function TermsPage() {
  const contact = legalConfig.contactEmail
    ? <a className="text-link" href={`mailto:${legalConfig.contactEmail}`}>{legalConfig.contactEmail}</a>
    : <Link className="text-link" href="/contact">the contact page</Link>;

  return (
    <main id="main-content" className="page-shell">
      <div className="container prose-page">
        <p className="eyebrow">Legal</p>
        <h1>Terms of service</h1>
        <p>
          Last updated: {legalConfig.lastUpdated}. Changes: clarified optional analytics and Meta
          Pixel privacy choices.
        </p>

        <h2>1. Acceptance and eligibility</h2>
        <p>
          By accessing or using AgentNine and its related features, you agree to these terms and the{" "}
          <Link className="text-link" href="/privacy">Privacy policy</Link>. If you do not agree,
          do not use the service. AgentNine is intended for people aged 18 and over. By using the
          service, you confirm that you are at least 18.
        </p>

        <h2>2. Description of the service</h2>
        <p>
          AgentNine is a public directory of AI-agent projects. It provides listings, editorial
          context, setup notes, recorded verification information, search and comparison tools, and
          links to upstream sources. Public browsing does not require an account.
        </p>
        <p>
          Google Analytics and Meta Pixel are optional and are enabled only if you allow them. You
          can change your choice on the{" "}
          <Link className="text-link" href="/privacy/choices">privacy choices page</Link>. Details
          about information these providers may receive are in the{" "}
          <Link className="text-link" href="/privacy">Privacy policy</Link> and{" "}
          <Link className="text-link" href="/cookies">Cookies and preferences</Link>.
        </p>
        <p>
          AgentNine is not offered to people in the European Economic Area, the United Kingdom, or
          Switzerland. You must not use the service from those locations.
        </p>

        <h2>3. Projects, licenses, and use</h2>
        <p>
          AgentNine does not grant a license to third-party projects listed in the directory.
          Software, names, logos, documentation, and other materials remain subject to their
          respective owners&apos; terms and licenses. Before downloading or running a project, review
          its upstream license, security posture, dependencies, permissions, and applicable
          provider terms. You are responsible for your use of external software.
        </p>
        <p>
          Verification scores, dates, and evidence describe checks recorded at a point in time. They
          are not safety certifications, endorsements, security audits, warranties, or guarantees of
          compatibility or performance. Listings, instructions, prices, dependencies, and links may
          be incomplete, outdated, or unavailable. Check important details against the upstream
          project before relying on them.
        </p>
        <p>
          Some listed projects may be dual-use, including tools that can be used for security
          testing. Use them only on systems you own or are expressly authorized to test, and comply
          with applicable law. AgentNine does not authorize unlawful access, disruption, surveillance,
          or harm.
        </p>

        <h2>4. Intellectual property and takedown requests</h2>
        <p>
          AgentNine branding and original editorial content belong to their respective owners unless
          otherwise stated. Listing a third-party project does not imply endorsement or affiliation.
          Third-party names, marks, software, and documentation belong to their respective owners;
          their presence in a listing does not transfer ownership or grant rights beyond applicable
          licenses.
        </p>
        <p>
          To report alleged infringement or request review/removal of a listing, contact us at{" "}
          {contact} with the relevant page or material, the source or rights at issue, why it should
          be reviewed, and a way to reach you. We may request additional information, review the
          report, and take appropriate action, including correcting, restricting, or removing
          material. A report is not automatically a finding of infringement.
        </p>

        <h2>5. Corrections and submissions</h2>
        <p>
          To request a correction to a listing, use the{" "}
          <Link className="text-link" href="/contact">contact page</Link> and identify the listing,
          the detail you believe is inaccurate, and a reliable source supporting the correction.
          AgentNine reviews reports but does not guarantee a particular outcome or response time.
        </p>
        <p>
          If you create an account, provide accurate information, protect your credentials, and take
          responsibility for activity performed through it. If you send a contribution, you confirm
          that you may share it for review. You retain ownership of your submission and permit
          AgentNine to use it to review, respond to, and display the resulting directory correction
          or contribution.
        </p>
        <p>
          Feedback submitted through the feedback page remains private unless you explicitly permit
          public display. AgentNine may publish permitted feedback on its homepage only after
          administrator review. You retain ownership of your feedback and may contact AgentNine to
          request that published feedback be removed.
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
          features. The service is provided on an “as available” basis. These terms may be updated;
          the date above identifies the latest revision.
        </p>

        <h2>8. Disclaimers and liability</h2>
        <p>
          To the extent permitted by applicable law, AgentNine and its operator are not liable for
          indirect, incidental, special, consequential, or punitive loss, or for loss of data,
          profits, or business arising from use of the directory or third-party projects. To the
          extent a liability limit is permitted, the aggregate liability of AgentNine and its
          operator for claims relating to the service will not exceed {legalConfig.liabilityCap}.
          This limit does not
          apply where liability cannot legally be limited, and does not remove any non-waivable
          consumer rights. These terms do not guarantee that any external project is safe, supported,
          or suitable for you.
        </p>

        <h2>9. Governing law and disputes</h2>
        <p>
          These terms are governed by the laws of {legalConfig.governingLaw}, subject to any
          mandatory protections that apply where you live. Subject to those protections, disputes
          are subject to the jurisdiction of the competent courts in {legalConfig.city}.
        </p>

        <h2>10. Contact</h2>
        <p>Questions, correction reports, and takedown requests can be sent to {contact}.</p>
      </div>
    </main>
  );
}
