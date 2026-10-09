import type { SetupGuide } from "@/lib/types";
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
  return <div className="setup-code-row">
    <h4>{label}</h4>
    {commands.map((command, index) => <CopyableCommand key={`${command}-${index}`} label={label} value={command} />)}
  </div>;
}

export function SetupGuidePanel({ guide }: {
  guide: SetupGuide;
}) {
  return <div className="setup-guide">
    {operatingSystems.map(([os, label]) => {
      const platform = guide.platforms?.[os];
      const installCommands = platform?.install_commands ?? [];
      const uninstallCommands = platform?.uninstall_commands ?? [];
      const unsupported = platform?.support === "unsupported";
      const sourceChecked = Boolean(guide.source_url && guide.checked_at);
      return <details className="setup-platform" key={os}>
        <summary>{label}</summary>
        {platform?.install_route ? <p className="setup-platform-route">{platform.install_route}</p> : null}
        {unsupported ? <p className="setup-platform-empty">The upstream project does not support this OS.</p> : <>
          {/* If there's no platform data or no commands, show a clear message so the panel has visible content and users know why it may be empty. */}
          {/* If there is no platform entry for this OS: show either a reviewed-empty message or the unreviewed placeholders depending on whether the source was checked. */}
          {(!platform) && (sourceChecked
            ? <p className="setup-platform-empty">No setup record is available for this OS.</p>
            : <>
              <p className="setup-platform-empty">Install instructions have not been reviewed.</p>
              <p className="setup-platform-empty">Removal instructions have not been reviewed.</p>
            </>
          )}

          {/* If a platform exists but has no commands, and the source was checked, show the reviewed-empty message. */}
          {(platform && installCommands.length === 0 && uninstallCommands.length === 0 && sourceChecked) ? <p className="setup-platform-empty">No shell commands are recorded for this OS.</p> : null}

          {installCommands.length
            ? <CodeRow label="Install code" commands={installCommands} />
            : (platform && !sourceChecked) ? <p className="setup-platform-empty">{platform.download_url
              ? "No shell install command is listed. Use the official download."
              : "Install instructions have not been reviewed."}</p> : null}
          {platform?.download_url
            ? <a className="setup-platform-download" href={platform.download_url} target="_blank" rel="noreferrer">Official download</a>
            : null}
          {uninstallCommands.length
            ? <CodeRow label="Uninstall code" commands={uninstallCommands} />
            : (platform && !sourceChecked) ? <p className="setup-platform-empty">Removal instructions have not been reviewed.</p> : null}
        </>}
      </details>;
    })}
  </div>;
}
