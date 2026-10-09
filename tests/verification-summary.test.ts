import type { ComponentProps } from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { VerificationSummary } from "@/components/VerificationSummary";

type SummaryAgent = ComponentProps<typeof VerificationSummary>["agent"];

function renderSummary(agent: SummaryAgent) {
  return renderToStaticMarkup(createElement(VerificationSummary, { agent }));
}

describe("agent verification summary", () => {
  it("keeps the checklist as the single concise verification summary", () => {
    const markup = renderSummary({
      verification_score: 5,
      verified_commit_sha: null,
      verified_operating_systems: [],
      verified_install_command: "",
      verified_first_task: "",
      verification_failure_conditions: "",
      verification_notes: "",
    });

    expect(markup).toContain("Verification checks");
    expect(markup).toContain("5/5 checks");
    expect(markup).toContain("Pinned source checkout");
    expect(markup).toContain("Successful run on a typical machine");
    expect(markup).not.toContain("Evidence record");
    expect(markup).not.toContain("What the checks mean");
    expect(markup).not.toContain("All five AgentNine checklist items have recorded evidence");
    expect(markup).not.toContain("Last reviewed");
  });

  it("keeps incomplete checklist items visible without adding a review-date repeat", () => {
    const markup = renderSummary({
      verification_score: 2,
      verified_commit_sha: null,
      verified_operating_systems: [],
      verified_install_command: "",
      verified_first_task: "",
      verification_failure_conditions: "",
      verification_notes: "",
    });

    expect(markup).toContain("2/5 checks");
    expect(markup).toContain("Dependency installation");
    expect(markup).not.toContain("Last reviewed");
  });
});
