import Image from "next/image";
import Link from "next/link";
import ArrowUpRight from "reicon-react/icons/ArrowUpRight";
import { FounderPortraitMotion } from "@/components/FounderPortraitMotion";
import { TeamRevealGrid, type TeamRevealMember } from "@/components/ui/team-reveal-grid";

const teamMembers = [
  {
    id: "nilesh",
    name: "Nilesh",
    role: "Founder & Tech Lead",
    expertise: "AI engineer and founder of AgentNine.",
    image: "/nilesh-profile.jpeg",
    imageAlt: "Illustrated black-and-white portrait of Nilesh",
    imagePosition: "center 18%",
    accent: "var(--blue)",
  },
  {
    id: "ali-sibtain",
    name: "Ali Sibtain",
    role: "Marketing Lead",
    expertise: "Leads marketing for AgentNine.",
    image: "/ali-sibtain-profile.webp",
    imageAlt: "Illustrated portrait provided for Ali Sibtain",
    imagePosition: "center 18%",
    accent: "var(--blue)",
  },
] satisfies readonly TeamRevealMember[];

export const metadata = {
  title: "About",
  description: "How AgentNine selects, reviews, and maintains AI agent project listings.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main id="main-content" className="page-shell founder-page">
      <div className="container">
        <section className="founder-hero" aria-labelledby="founder-title">
          <div className="founder-intro">
            <p className="eyebrow">About AgentNine</p>
            <h1 id="founder-title">What an AgentNine listing tells you.</h1>
            <p className="founder-lede">
              Each listing links to its upstream source and records available setup and system-access details.
            </p>
            <div className="founder-actions">
              <Link
                className="founder-action"
                href="https://nileshraj-portfolio.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Nilesh’s portfolio <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
              <Link className="founder-secondary-link" href="/join">
                Contribute to AgentNine
              </Link>
            </div>
          </div>
          <figure className="founder-portrait">
            <Link
              href="https://nileshraj-portfolio.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit Nilesh’s portfolio (opens in a new tab)"
            >
              <FounderPortraitMotion>
                <Image
                  src="/nilesh-profile.jpeg"
                  alt="Illustrated black-and-white profile portrait of Nilesh"
                  width={768}
                  height={1024}
                  priority
                  sizes="(max-width: 800px) 90vw, 42vw"
                />
              </FounderPortraitMotion>
            </Link>
            <figcaption>Nilesh, founder of AgentNine</figcaption>
          </figure>
        </section>

        <TeamRevealGrid
          className="founder-team"
          aria-label="AgentNine team"
          title="The team"
          members={teamMembers}
          defaultActiveMemberId={null}
          autoPlay={false}
        />

        <section className="about-editorial prose-page" aria-labelledby="about-agentnine-title">
          <h2 id="about-agentnine-title">What a listing covers</h2>
          <p>Listings record setup steps, version details, hardware requirements, system access, and removal instructions when those details are available from the upstream project.</p>
          <h2>How listing details are checked</h2>
          <p>We use the linked repository and project documentation. Read <Link className="text-link" href="/methodology">how verification and freshness are recorded</Link> to see what those checks do and do not establish.</p>
          <h2>Selection and removal</h2>
          <p>Projects need a clear upstream source and a documented first-run path. We may mark or remove a listing if its source breaks, setup details become misleading, or a serious issue makes continued listing inappropriate. We do not audit upstream security, licensing, or legal compliance.</p>
          <h2>Independent by design</h2>
          <p>We are not affiliated with the creators or repositories listed here. A listing is not a partnership, endorsement, or security certification. If you spot a broken detail, <Link className="text-link" href="/contact">tell us</Link>.</p>
        </section>
      </div>
    </main>
  );
}
