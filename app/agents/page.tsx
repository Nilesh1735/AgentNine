import Link from "next/link";
import { CatalogState } from "@/components/CatalogState";
import { getAgents } from "@/lib/data";
import { createPublicPageMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { serializeJsonLd } from "@/lib/json-ld";

export const dynamic = "force-dynamic";

export const metadata = createPublicPageMetadata({
  title: "Open-Source AI Agent Listings",
  description: "Browse open-source AI agent listings, then check each project's repository, setup guide, system requirements, and documented access.",
  path: "/agents",
});

export default async function AgentsPage() {
  const result = await getAgents();
  const agents = [...result.data].sort((left, right) => left.name.localeCompare(right.name));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/agents`,
    url: `${SITE_URL}/agents`,
    name: "All open-source AI agents",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: agents.length,
      itemListElement: agents.map((agent, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: agent.name,
        url: `${SITE_URL}/agents/${agent.slug}`,
      })),
    },
  };

  return (
    <main id="main-content" className="page-shell agents-index-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <div className="container">
        <div className="page-heading">
          <h1>All agents.</h1>
        </div>
        {result.status === "unavailable" || !agents.length ? (
          <CatalogState result={result} itemLabel="published agents" emptyDescription="No agents are published yet." />
        ) : (
          <ol className="agents-name-list">
            {agents.map((agent) => (
              <li key={agent.id}>
                <Link href={`/agents/${agent.slug}`}>{agent.name}</Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </main>
  );
}
