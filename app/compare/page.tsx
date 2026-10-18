import Link from "next/link";
import { CompareButton } from "@/components/CompareButton";
import { getAgent } from "@/lib/data";
import { getAgentTrustState, getFreshnessNote } from "@/lib/trust";
import type { Agent } from "@/lib/types";
import { MAX_COMPARE_AGENTS, getSetupCommandPlatforms, normalizeCompareSlugs } from "@/lib/compare";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Compare AI agent projects",
  robots: { index: false, follow: false },
};

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
  ["Platforms with setup commands", (agent) => getSetupCommandPlatforms(agent).map((os) => os === "macos" ? "macOS" : os[0].toUpperCase() + os.slice(1)).join(", ") || "None recorded"],
  ["Network access", (agent) => agent.network_access || "Not recorded"],
  ["File access", (agent) => agent.file_access || "Not recorded"],
  ["Hardware", (agent) => agent.hardware_requirements || "Not recorded"],
  ["Upstream changes since verification", (agent) => agent.upstream_changed_since_verification ? "Changed since verification" : "No change recorded"],
];

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ agents?: string }> }) {
  const raw = (await searchParams).agents ?? "";
  const requestedSlugs = [...new Set(raw.split(",").filter(Boolean))];
  const slugs = normalizeCompareSlugs(requestedSlugs);
  const agents = (await Promise.all(slugs.map((slug) => getAgent(slug)))).filter((agent): agent is NonNullable<typeof agent> => Boolean(agent));
  const unavailableSelection = requestedSlugs.length > MAX_COMPARE_AGENTS
    || requestedSlugs.length !== slugs.length
    || slugs.length !== agents.length;

  return (
    <main id="main-content" className="page-shell">
      <div className="container compare-page">
        <div className="page-heading"><p className="eyebrow">Comparison</p><h1>Compare AI agent projects.</h1></div>
        {unavailableSelection ? <p className="compare-selection-notice" role="status">One or more selected agents could not be loaded. Choose from the available listings below.</p> : null}
        {agents.length < 2 ? (
          <section className="compare-empty">
            <h2>{agents.length === 1 ? "Add one more agent to compare." : "Select at least two agents."}</h2>
            <p>Choose agents from the directory, then compare their recorded details side by side.</p>
            <Link className="button button-dark" href="/search">Browse agents</Link>
          </section>
        ) : null}
        {agents.length > 0 ? (
          <>
            <div className="compare-table-wrap"><table className="compare-table"><thead><tr><th scope="col">Field</th>{agents.map((agent) => <th scope="col" key={agent.id}><Link href={`/agents/${agent.slug}`}>{agent.name}</Link><CompareButton slug={agent.slug} /></th>)}</tr></thead><tbody><tr><th scope="row">Description</th>{agents.map((agent) => <td key={agent.id}>{agent.short_description}</td>)}</tr>{rows.map(([label, value]) => <tr key={label}><th scope="row">{label}</th>{agents.map((agent) => <td key={agent.id}>{value(agent)}</td>)}</tr>)}</tbody></table></div>
            <p className="compare-note">The agents shown here come from this URL. Use “In compare” to remove an agent, or browse the directory to add another.</p>
          </>
        ) : null}
      </div>
    </main>
  );
}
