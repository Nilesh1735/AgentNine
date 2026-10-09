import type { Agent } from "@/lib/types";

const checks = [
  "Pinned source checkout",
  "Dependency installation",
  "Provider setup",
  "First prompt",
  "Successful run on a typical machine",
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
  const score = Math.max(0, Math.min(checks.length, agent.verification_score));

  return (
    <section className="verification-summary" aria-labelledby="verification-summary-title">
      <div className="verification-summary-heading">
        <h2 id="verification-summary-title">Verification checks</h2>
        <strong aria-label={`${score} of ${checks.length} checks recorded`}>{score}/{checks.length} checks</strong>
      </div>
      <ul>
        {checks.map((check, index) => (
          <li key={check} className={index < score ? "is-complete" : ""}>
            <span aria-hidden="true">{index < score ? "✓" : "○"}</span>
            <span>{check}</span>
          </li>
        ))}
      </ul>
      {agent.verification_score === checks.length && (agent.verified_commit_sha || agent.verified_install_command || agent.verified_first_task || agent.verification_notes) ? (
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
