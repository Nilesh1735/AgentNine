import Link from "next/link";
import { CompareButton } from "@/components/CompareButton";
import { getAgent } from "@/lib/data";
import { getAgentTrustState, getFreshnessNote } from "@/lib/trust";
import type { Agent } from "@/lib/types";
import { getComparisonFit } from "@/lib/compare";

export const dynamic = "force-dynamic";

const rows: Array<[string, (agent: Agent) => string]> = [
  ["Status", (agent) => getAgentTrustState(agent).label],
  ["Version", (agent) => agent.version_tag || "Not recorded"],
  ["Repository freshness", (agent) => getFreshnessNote(agent) || "Not recorded"],
  ["Verification", (agent) => `${agent.verification_score}/5 checks recorded`],
  ["Stars", (agent) => agent.stars ? agent.stars.toLocaleString() : "Not recorded"],
  ["Cost to run", (agent) => agent.cost_to_run || "Not recorded"],
  ["API key requirement", (agent) => agent.requires_api_key === true
    ? "Required for documented setup"
    : agent.requires_api_key === false
      ? "Not required for documented local or default setup"
      : "Not confirmed"],
  ["Platforms with setup commands", (agent) => Object.entries(agent.os_commands).filter(([, commands]) => commands?.length).map(([os]) => os).join(", ") || "None recorded"],
  ["Network access", (agent) => agent.network_access || "Not recorded"],
  ["File access", (agent) => agent.file_access || "Not recorded"],
  ["Hardware", (agent) => agent.hardware_requirements || "Not recorded"],
  ["Upstream changes since verification", (agent) => agent.upstream_changed_since_verification ? "Changed since verification" : "No change recorded"],
];

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ agents?: string }> }) {
  const raw = (await searchParams).agents ?? "";
  const slugs = [...new Set(raw.split(",").filter((slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)))].slice(0, 3);
  const agents = (await Promise.all(slugs.map((slug) => getAgent(slug)))).filter((agent): agent is NonNullable<typeof agent> => Boolean(agent));
  const comparisonFit = agents.length >= 2 ? getComparisonFit(agents) : null;

  return (
    <main id="main-content" className="page-shell">
      <div className="container compare-page">
        <div className="page-heading"><p className="eyebrow">Comparison</p><h1>Compare AI agent projects.</h1></div>
        {agents.length < 2 ? (
          <section className="compare-empty"><h2>Select at least two agents.</h2><p>Use Compare on agent cards or guides, then open the comparison view.</p><Link className="button button-dark" href="/search">Browse agents</Link></section>
        ) : (
          <>
            <div className="compare-fit"><strong>Recorded comparison signals</strong><div><span className="compare-fit-agent">{comparisonFit?.label}</span><p>{comparisonFit?.reasons.length ? `Signals recorded: ${comparisonFit.reasons.join("; ")}.` : "No qualifying comparison signals are recorded for this project."} Use the fields below to decide whether it fits your needs.</p></div></div>
            <div className="compare-table-wrap"><table className="compare-table"><thead><tr><th scope="col">Field</th>{agents.map((agent) => <th scope="col" key={agent.id}><Link href={`/agents/${agent.slug}`}>{agent.name}</Link><CompareButton slug={agent.slug} /></th>)}</tr></thead><tbody><tr><th scope="row">Description</th>{agents.map((agent) => <td key={agent.id}>{agent.short_description}</td>)}</tr>{rows.map(([label, value]) => <tr key={label}><th scope="row">{label}</th>{agents.map((agent) => <td key={agent.id}>{value(agent)}</td>)}</tr>)}</tbody></table></div>
            <p className="compare-note">This comparison is saved with your AgentNine preferences.</p>
          </>
        )}
      </div>
    </main>
  );
}
