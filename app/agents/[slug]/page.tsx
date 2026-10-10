import type { Metadata } from "next";
import Link from "next/link";
import Check from "reicon-react/icons/Check";
import { notFound } from "next/navigation";
import { AgentAnalytics } from "@/components/AgentAnalytics";
import { AgentFeedback } from "@/components/AgentFeedback";
import { AgentPageNavigation } from "@/components/AgentPageNavigation";
import { AgentCard } from "@/components/AgentCard";
import { ReportBrokenLink } from "@/components/ReportBrokenLink";
import { SourceLink } from "@/components/SourceLink";
import { getAgent, getAgents, getCategories, getRelatedAgents } from "@/lib/data";
import { SavedAgentButton } from "@/components/SavedAgentButton";
import { CompareButton } from "@/components/CompareButton";
import { serializeJsonLd } from "@/lib/json-ld";
import { VerificationSummary } from "@/components/VerificationSummary";
import { getAgentTrustState } from "@/lib/trust";
import { SetupGuidePanel } from "@/components/SetupGuidePanel";
import { formatCatalogDate, getCompactVersionLabel, getReleaseRecord } from "@/lib/agent-metadata-display";
import { createPublicPageMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const result = await getAgents();
  return result.status === "ready"
    ? result.data.map((agent) => ({ slug: agent.slug }))
    : [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const agent = await getAgent((await params).slug);
  if (!agent) return { title: "Agent not found" };
  const description = `${agent.short_description} Review setup guidance, requirements, and documented system access before running it.`;
  return createPublicPageMetadata({
    title: `${agent.name} setup guide`,
    description,
    path: `/agents/${agent.slug}`,
    type: "article",
  });
}

export default async function AgentPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const [agent, categories] = await Promise.all([getAgent(slug), getCategories()]);
  if (!agent) notFound();
  const relatedAgents = await getRelatedAgents(agent);
  const category = categories.data.find((item) => item.id === agent.category_id);
  const trust = getAgentTrustState(agent);
  const verificationDate = agent.last_verified_date === "Not verified"
    ? ""
    : formatCatalogDate(agent.last_verified_date);
  const operatingSystems = (["linux", "macos", "windows"] as const).filter((os) => agent.setup_guide.platforms?.[os]?.support === "supported").map((os) => os === "macos" ? "macOS" : os[0].toUpperCase() + os.slice(1));
  const agentUrl = `${SITE_URL}/agents/${agent.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": agentUrl,
    url: agentUrl,
    name: agent.name,
    description: agent.short_description,
    applicationCategory: "DeveloperApplication",
    ...(operatingSystems.length ? { operatingSystem: operatingSystems } : {}),
    softwareVersion: getCompactVersionLabel(agent.version_tag),
    ...(agent.github_url ? { codeRepository: agent.github_url } : {}),
  };
  const breadcrumbLd = category
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Categories", item: `${SITE_URL}/categories` },
          { "@type": "ListItem", position: 3, name: category.name, item: `${SITE_URL}/categories/${category.slug}` },
          { "@type": "ListItem", position: 4, name: agent.name, item: agentUrl },
        ],
      }
    : null;
  const permissionRows = [
    ["Network", agent.network_access || "Not documented in this listing"],
    ["Files", agent.file_access || "Not documented in this listing"],
    ["Ports", agent.port_mapping || "Not documented in this listing"],
    ["Storage", agent.memory_location || "Not documented in this listing"],
    ["API key", agent.requires_api_key === true
      ? "Required for the documented setup"
      : agent.requires_api_key === false
        ? "Not required for a documented local or default setup"
        : "Depends on provider or not documented"],
  ].filter(Boolean) as [string, string][];
  return (
    <main id="main-content" className="agent-detail-page">
      <AgentAnalytics slug={agent.slug} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      {breadcrumbLd
        ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbLd) }} />
        : null}
      <section className="agent-hero">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/categories">Categories</Link>
            {category ? <>
              <span aria-hidden="true">/</span>
              <Link href={`/categories/${category.slug}`}>{category.name}</Link>
            </> : null}
            <span aria-current="page">{agent.name}</span>
          </nav>
          <div className="agent-hero-kicker">
            <span className="check"><Check size={14} aria-hidden="true" /></span>
            <span className={trust.className}>{trust.label}</span>
            {category ? <span>{category.name}</span> : null}
          </div>
          <h1>{agent.name}</h1>
          <p className="agent-summary">{agent.short_description}</p>
          <div className="agent-meta">
            <span><b>Version record</b> {agent.version_tag || "Not recorded"}</span>
            <span><b>Release record</b> {getReleaseRecord(agent)}</span>
            <span><b>Repository metadata checked</b> {formatCatalogDate(agent.metadata_last_checked_at) ?? "Not checked"}</span>
            {agent.stars ? <span><b>Stars</b> {agent.stars.toLocaleString()}</span> : null}
            {agent.last_verified_date && agent.last_verified_date !== "Not verified"
              ? <span><b>Setup reviewed</b> {verificationDate}</span>
              : null}
            {agent.cost_to_run ? <span><b>Cost</b> {agent.cost_to_run}</span> : null}
          </div>
          <div className="agent-hero-actions">
            {agent.github_url
              ? <SourceLink href={agent.github_url} slug={agent.slug} label="GitHub repository" />
              : null}
            <SavedAgentButton agentId={agent.id} slug={agent.slug} />
            <CompareButton slug={agent.slug} />
          </div>
        </div>
      </section>
      <div className="container agent-layout">
        <article>
          <AgentPageNavigation />
          <section className="content-section agent-overview" id="quick-read">
            <VerificationSummary agent={agent} />
          </section>
          <section className="content-section" id="setup">
            <h2>Setup</h2>
            <SetupGuidePanel guide={agent.setup_guide} />
          </section>
          <section className="content-section" id="report">
            <h2>Report a problem</h2>
            <ReportBrokenLink slug={agent.slug} />
          </section>
          <AgentFeedback slug={agent.slug} />
          {relatedAgents.length ? (
            <section className="content-section">
              <h2>Related agents</h2>
              <div className="agent-grid related-grid">
                {relatedAgents.map((related) => (
                  <AgentCard
                    key={related.id}
                    agent={related}
                    category={categories.data.find((item) => item.id === related.category_id)}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </article>
        <aside>
          <section className="sidebar-card permissions-card" aria-labelledby="permissions-title">
            <div className="permissions-heading">
              <div>
                <p className="audit-kicker">Access</p>
                <h2 id="permissions-title">Permissions &amp; requirements</h2>
              </div>
              <span className="permissions-mark" aria-hidden="true">i</span>
            </div>
            {permissionRows.length ? (
              <dl className="permissions-list">
                {permissionRows.map(([label, value]) => (
                  <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                ))}
              </dl>
            ) : null}
          </section>
        </aside>
      </div>
    </main>
  );
}
