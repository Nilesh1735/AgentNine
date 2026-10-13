import type { Agent } from "@/lib/types";

const CHECK_COUNT = 5;
const checks = [
  "Recorded the agent version tested",
  "Installed the agent's dependencies",
  "Connected a model provider",
  "Used the agent for a first task",
  "Ran the agent through a test",
];

type VerificationSummaryAgent = Pick<
  Agent,
  | "verification_score"
  | "verified_commit_sha"
  | "verified_operating_systems"
  | "verified_install_command"
  | "verified_first_task"
  | "verification_failure_conditions"
  | "verification_notes"
>;

export function VerificationSummary({ agent }: { agent: VerificationSummaryAgent }) {
  const score = Math.max(0, Math.min(CHECK_COUNT, agent.verification_score));

  return (
    <section className="verification-summary" aria-labelledby="verification-summary-title">
      <div className="verification-summary-heading">
        <h2 id="verification-summary-title">Verification checks</h2>
        <strong aria-label={`${score} of ${CHECK_COUNT} checks recorded`}>{score}/{CHECK_COUNT} checks</strong>
      </div>
      {score < CHECK_COUNT ? (
        <p className="verification-summary-note">
          The total reflects recorded evidence; individual completed checks are not available for this listing.
        </p>
      ) : null}
      <ul className="verification-checklist">
        {checks.map((check) => (
          <li key={check} className={score === CHECK_COUNT ? "is-complete" : ""}>
            <span className="verification-check-indicator" aria-hidden="true">
              {score === CHECK_COUNT ? "✓" : ""}
            </span>
            <span>{check}</span>
          </li>
        ))}
      </ul>
      {score === CHECK_COUNT && (agent.verified_commit_sha || agent.verified_install_command || agent.verified_first_task || agent.verification_notes) ? (
        <dl className="verification-evidence">
          {agent.verified_commit_sha ? <div><dt>Verified commit</dt><dd>{agent.verified_commit_sha}</dd></div> : null}
          {agent.verified_operating_systems.length ? <div><dt>Tested systems</dt><dd>{agent.verified_operating_systems.join(", ")}</dd></div> : null}
          {agent.verified_install_command ? <div><dt>Install command</dt><dd>{agent.verified_install_command}</dd></div> : null}
          {agent.verified_first_task ? <div><dt>First successful task</dt><dd>{agent.verified_first_task}</dd></div> : null}
          {agent.verification_failure_conditions ? <div><dt>Known limits</dt><dd>{agent.verification_failure_conditions}</dd></div> : null}
          {agent.verification_notes ? <div><dt>Notes</dt><dd>{agent.verification_notes}</dd></div> : null}
        </dl>
      ) : null}
    </section>
  );
}
