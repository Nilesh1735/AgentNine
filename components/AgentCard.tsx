import Link from "next/link";
import type { Agent, Category } from "@/lib/types";
import { getAgentTrustState } from "@/lib/trust";
import { getCompactVersionLabel, getRepositoryFreshnessLabel } from "@/lib/agent-metadata-display";
import { CompareButton } from "@/components/CompareButton";
import { AgentArtwork } from "@/components/AgentArtwork";
import ArrowUpRight from "reicon-react/icons/ArrowUpRight";
import ArrowRight from "reicon-react/icons/ArrowRight";

export function AgentCard({ agent, category, showUpstreamActivity = true }: { agent: Agent; category?: Category; showUpstreamActivity?: boolean }) {
  const trust = getAgentTrustState(agent);
  const freshnessNote = getRepositoryFreshnessLabel(agent, showUpstreamActivity);
  return (
    <article className="agent-card">
      <AgentArtwork seed={agent.slug} categorySlug={category?.slug} />
      <div className="card-topline">
        <Link className="card-category" href={category ? `/categories/${category.slug}` : "/categories"} prefetch={false}>{category?.name ?? "Agent"}<ArrowUpRight size={12} aria-hidden="true" /></Link>
        <span className={trust.className} aria-label={trust.detail}><span className="verification-score">{agent.verification_score}/5</span><span className="verification-label">{trust.label}</span></span>
      </div>
      <div className="verification-bar" aria-label={`${agent.verification_score} of 5 verification checks recorded`} role="img">
        {[0, 1, 2, 3, 4].map((segment) => <span className={`verification-segment${segment < agent.verification_score ? " filled" : ""}`} key={segment} />)}
      </div>
      <h3><Link href={`/agents/${agent.slug}`} prefetch={false}>{agent.name}</Link></h3>
      <p className="line-clamp-2">{agent.short_description}</p>
      <div className="tag-row">{agent.tags.slice(0, 4).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
      <div className="card-footer">
        <span className="card-meta">
          <span><b>Version</b> {getCompactVersionLabel(agent.version_tag)}</span>
          <span>{freshnessNote}</span>
        </span>
        <span className="card-actions"><CompareButton slug={agent.slug} /><Link className="text-link" href={`/agents/${agent.slug}`} prefetch={false}>View guide <ArrowRight size={14} aria-hidden="true" /></Link></span>
      </div>
    </article>
  );
}
