import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact AgentNine",
  description: "Suggest an AI-agent project or report an issue with an AgentNine listing.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
