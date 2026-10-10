import type { Metadata } from "next";
import { createPublicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Contact AgentNine",
  description: "Suggest an AI-agent project or report an issue with an AgentNine listing.",
  path: "/contact",
});

export default function ContactLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
