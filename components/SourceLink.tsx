"use client";

import { trackEvent } from "@/lib/analytics";
import ArrowUpRight from "reicon-react/icons/ArrowUpRight";

export function SourceLink({ href, slug, label = "View source on GitHub" }: { href: string; slug: string; label?: string }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="button button-dark github-link" onClick={() => trackEvent("source_click", { slug })}>{label} <ArrowUpRight size={15} aria-hidden="true" /></a>;
}
