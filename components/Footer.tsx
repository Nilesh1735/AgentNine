import Link from "next/link";
import ArrowUpRight from "reicon-react/icons/ArrowUpRight";
import { BrandMark } from "@/components/BrandMark";
import { SocialLinks } from "@/components/SocialLinks";

const socialLinks = [
  { platform: "GitHub", href: "https://github.com/Nilesh1735/AgentNine" },
  { platform: "LinkedIn", href: "https://www.linkedin.com/company/agentnine/" },
  { platform: "X", href: "https://x.com/agentninepro" },
  { platform: "Instagram", href: "https://www.instagram.com/agentnine.pro" },
  { platform: "Facebook", href: "https://www.facebook.com/share/1DeKsDQoQ7/" },
] as const;

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand-block">
          <Link href="/" className="brand"><BrandMark /><span>AgentNine</span></Link>
          <p className="footer-note">Compare AI agent projects with clear setup guidance, source links, and practical access details.</p>
          <SocialLinks
            links={socialLinks}
            label="AgentNine social media"
            className="footer-social-links"
          />
          <Link href="/contact" className="footer-correction-link">Suggest a correction <ArrowUpRight size={14} aria-hidden="true" /></Link>
        </div>
        <div className="footer-links">
          <nav aria-label="Explore">
            <strong>Explore</strong>
            <Link href="/agents">All agents</Link>
            <Link href="/categories">Categories</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/compare">Compare agents</Link>
          </nav>
          <nav aria-label="About">
            <strong>About</strong>
            <Link href="/about">About AgentNine</Link>
            <Link href="/news">News</Link>
            <Link href="/methodology">Trust and methodology</Link>
            <Link href="/join">Join us</Link>
            <Link href="/contact">Contact</Link>
          </nav>
          <nav aria-label="Legal">
            <strong>Legal</strong>
            <Link href="/privacy">Privacy</Link>
            <Link href="/cookies">Cookies</Link>
            <Link className="consent-preferences-button" href="/privacy/choices">Privacy choices</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy#retention-and-deletion">Privacy requests</Link>
          </nav>
        </div>
      </div>
      <div className="container footer-bottom"><span>© {new Date().getFullYear()} AgentNine</span><span>Independent directory. Check details against the project itself.</span></div>
    </footer>
  );
}
