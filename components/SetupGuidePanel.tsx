import type { SetupCommandPhase, SetupGuide } from "@/lib/types";
import { CopyableCommand } from "@/components/SetupStepper";

const operatingSystems = [
  ["windows", "Windows"],
  ["macos", "macOS"],
  ["linux", "Linux"],
] as const;

function CodeRow({ label, commands }: {
  label: string;
  commands: string[];
}) {
  const isSequence = commands.length > 1;
  return <div className="setup-code-row">
    <h4>{label}</h4>
    {isSequence
      ? <>
        <p className="setup-command-hint">Run these commands in order.</p>
        <ol className="setup-command-sequence">
          {commands.map((command, index) => (
            <li key={`${command}-${index}`}>
              <span className="setup-command-sequence-number" aria-hidden="true">{index + 1}</span>
              <CopyableCommand label={label} value={command} sequenceNumber={index + 1} sequenceContext={label} />
            </li>
          ))}
        </ol>
      </>
      : commands.map((command, index) => <CopyableCommand key={`${command}-${index}`} label={label} value={command} />)}
  </div>;
}

function CommandPhase({ phase }: { phase: SetupCommandPhase }) {
  return <section className="setup-command-phase">
    <h4>{phase.title}</h4>
    {phase.note ? <p className="setup-command-hint">{phase.note}</p> : null}
    {phase.commands.length > 1
      ? <p className="setup-command-hint">Run these commands in order.</p>
      : null}
    {phase.commands.length
      ? <ol className="setup-command-sequence">
        {phase.commands.map((command, index) => (
          <li key={`${command}-${index}`}>
            <span className="setup-command-sequence-number" aria-hidden="true">{index + 1}</span>
            <CopyableCommand label={phase.title} value={command} sequenceNumber={index + 1} sequenceContext={phase.title} />
          </li>
        ))}
      </ol>
      : null}
  </section>;
}

export function SetupGuidePanel({ guide }: {
  guide: SetupGuide;
}) {
  return <div className="setup-guide">
    {operatingSystems.map(([os, label]) => {
      const platform = guide.platforms?.[os];
      const installCommands = platform?.install_commands ?? [];
      const commandPhases = platform?.command_phases ?? [];
      const uninstallCommands = platform?.uninstall_commands ?? [];
      const firstRunCommands = platform?.first_run_commands ?? [];
      const firstRunSteps = platform?.first_run_steps ?? [];
      const unsupported = platform?.support === "unsupported";
      const sourceChecked = Boolean(guide.source_url && guide.checked_at);
      return <details className="setup-platform" key={os}>
        <summary>{label}</summary>
        {platform?.prerequisites?.length
          ? <div className="setup-platform-details">
            <h4>Prerequisites</h4>
            <ul>{platform.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          : null}
        {platform?.install_route ? <p className="setup-platform-route">{platform.install_route}</p> : null}
        {unsupported ? <p className="setup-platform-empty">The project does not support this OS.</p> : <>
          {/* If there's no platform data or no commands, show a clear message so the panel has visible content and users know why it may be empty. */}
          {/* If there is no platform entry for this OS: show either a reviewed-empty message or the unreviewed placeholders depending on whether the source was checked. */}
          {(!platform) && (sourceChecked
            ? <p className="setup-platform-empty">No setup record is available for this OS.</p>
            : <>
              <p className="setup-platform-empty">Install instructions have not been reviewed.</p>
              <p className="setup-platform-empty">Removal instructions have not been reviewed.</p>
            </>
          )}

          {/* A download link already gives users an install route, so only show this when none is recorded. */}
          {(platform && installCommands.length === 0 && uninstallCommands.length === 0 && sourceChecked && !platform.download_url)
            ? <p className="setup-platform-empty">No shell commands are recorded for this OS.</p>
            : null}

          {platform?.provider_setup && commandPhases.length
            ? <div className="setup-platform-details setup-platform-provider">
              <h4>Provider setup</h4>
              <p>{platform.provider_setup}</p>
            </div>
            : null}
          {platform?.download_url
            ? <a className="setup-platform-download" href={platform.download_url} target="_blank" rel="noreferrer">{platform.download_label ?? "Official download"}</a>
            : null}
          {(commandPhases.length || installCommands.length) && platform?.terminal_note
            ? <p className="setup-command-terminal-note">{platform.terminal_note}</p>
            : null}
          {commandPhases.length
            ? <>
              <div className="setup-command-phases">
                {commandPhases.map((phase, index) => <CommandPhase key={`${phase.title}-${index}`} phase={phase} />)}
              </div>
            </>
            : installCommands.length
              ? <CodeRow label="Install commands" commands={installCommands} />
            : (platform && !sourceChecked && !platform.download_url)
              ? <p className="setup-platform-empty">Install instructions have not been reviewed.</p>
              : null}
          {platform?.provider_setup && !commandPhases.length
            ? <div className="setup-platform-details">
              <h4>Provider setup</h4>
              <p>{platform.provider_setup}</p>
            </div>
            : null}
          {firstRunCommands.length
            ? <CodeRow label="First-run commands" commands={firstRunCommands} />
            : null}
          {firstRunSteps.length
            ? <div className="setup-platform-details">
              <h4>First run</h4>
              <ol>{firstRunSteps.map((step, index) => <li key={`${index}-${step}`}>{step}</li>)}</ol>
            </div>
            : null}
          {uninstallCommands.length
            ? <CodeRow label="Uninstall code" commands={uninstallCommands} />
            : (platform && !sourceChecked) ? <p className="setup-platform-empty">Removal instructions have not been reviewed.</p> : null}
        </>}
      </details>;
    })}
  </div>;
}
