import Link from "next/link";
import ArrowUpRight from "reicon-react/icons/ArrowUpRight";
import { AgentCard } from "@/components/AgentCard";
import { CatalogState } from "@/components/CatalogState";
import { DirectoryPreview } from "@/components/DirectoryPreview";
import { getAgents, getCategories, getRecentlyUpdatedAgents } from "@/lib/data";
import { serializeJsonLd } from "@/lib/json-ld";
import { SITE_URL } from "@/lib/site";

export async function HomeCatalogSections() {
  const [agents, categories] = await Promise.all([getAgents(), getCategories()]);
  const featured = agents.data.slice(0, 3);
  const recentlyUpdated = getRecentlyUpdatedAgents(agents.data).slice(0, 4);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Featured AI agents",
    numberOfItems: featured.length,
    itemListElement: featured.map((agent, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: agent.name,
      url: `${SITE_URL}/agents/${agent.slug}`,
      item: `${SITE_URL}/agents/${agent.slug}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <section className="container">
        {agents.status === "unavailable" || categories.status === "unavailable"
          ? <CatalogState result={agents.status === "unavailable" ? agents : categories} itemLabel="directory records" emptyDescription="No published agent listings are available yet." />
          : <DirectoryPreview agents={agents.data} categories={categories.data} />}
      </section>
      <section className="category-band">
        <div className="container">
          <div className="band-heading"><p className="eyebrow">Categories</p><h2>Browse projects by category.</h2></div>
          <div className="category-links">{categories.data.map((category) => <Link key={category.id} href={`/categories/${category.slug}`}><span>{category.name}</span>{category.description ? <small>{category.description}</small> : null}<ArrowUpRight size={15} aria-hidden="true" /></Link>)}</div>
        </div>
      </section>
      {recentlyUpdated.length ? <section className="section recent-section"><div className="container"><div className="new-section-heading"><h2>Recently updated</h2></div><div className="recent-grid">{recentlyUpdated.map((agent) => <AgentCard key={agent.id} agent={agent} category={categories.data.find((category) => category.id === agent.category_id)} showUpstreamActivity={false} />)}</div></div></section> : null}
    </>
  );
}
