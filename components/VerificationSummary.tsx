import type { Agent } from "@/lib/types";
import { getAgentTrustState } from "@/lib/trust";

const checks = [
  "Exact source version reviewed",
  "Dependencies installed",
  "AI model provider connection confirmed",
  "First prompt completed",
  "Normal-machine run passed",
];

export function VerificationSummary({ agent }: { agent: Agent }) {
  const trust = getAgentTrustState(agent);
  const score = Math.max(0, Math.min(checks.length, agent.verification_score));

  return (
    <section className="verification-summary" aria-labelledby="verification-summary-title">
      <div className="verification-summary-heading">
        <h2 id="verification-summary-title">Verification checklist</h2>
        <strong aria-label={`${score} of ${checks.length} checklist steps recorded`}>{score}/{checks.length} steps</strong>
      </div>
      {trust.detail && !trust.isStale
        ? <p className="verification-summary-note">{trust.detail}</p>
        : null}
      {score === checks.length ? (
        <ul className="verification-checklist">
          {checks.map((check) => (
            <li key={check} className="is-complete">
              <span className="verification-check-indicator" aria-hidden="true">✓</span>
              <span>{check}</span>
            </li>
          ))}
        </ul>
      ) : <p className="verification-summary-note">The score shows how many checklist steps are recorded; individual completed steps are not available for this listing.</p>}
    </section>
  );
}
