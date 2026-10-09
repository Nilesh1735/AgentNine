import Link from "next/link";
import ArrowRight from "reicon-react/icons/ArrowRight";
import { BrandMark } from "@/components/BrandMark";

export const metadata = { title: "Page not found", description: "The requested AgentNine page could not be found." };

export default function NotFound() {
  return <main id="main-content" className="container not-found"><div className="brand" style={{ justifyContent: "center" }}><BrandMark /><span>AgentNine</span></div><p className="eyebrow">Page not found</p><h1>404</h1><p>We couldn’t find that page. Search the agent directory or return home.</p><div className="hero-actions"><Link href="/search" className="button button-dark">Search agents <ArrowRight size={16} aria-hidden="true" /></Link><Link href="/" className="button button-outline">Back home</Link></div></main>;
}
