import type { Metadata } from "next";
import { JoinForm } from "@/components/JoinForm";

export const metadata: Metadata = {
  title: "Join AgentNine",
  description: "Propose a contribution to AgentNine’s AI agent directory.",
  alternates: { canonical: "/join" },
};

export default function JoinPage() {
  return (
    <main id="main-content" className="page-shell join-page">
      <div className="container">
        <div className="join-heading">
          <p className="eyebrow">Contribute to AgentNine</p>
          <h1>Help keep agent listings useful.</h1>
          <p>
            Tell us what you would like to contribute. Applications are collected for review, and an email address is required to submit one.
          </p>
        </div>
        <JoinForm />
      </div>
    </main>
  );
}
