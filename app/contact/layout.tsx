import type { Metadata } from "next";
import { createPublicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Contact",
  description: "Suggest an AI agent, report a listing issue, or send a correction to AgentNine.",
  path: "/contact",
});

export default function ContactLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
