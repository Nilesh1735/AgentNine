import { SearchBox } from "@/components/SearchBox";
import { CatalogState } from "@/components/CatalogState";
import { getAgents, getCategories, getFreshnessCutoff } from "@/lib/data";
import { Suspense } from "react";
import { SearchContentSkeleton } from "@/components/SearchContentSkeleton";
import { createPublicPageMetadata } from "@/lib/seo";
import { toSearchAgent } from "@/lib/search-agent";

export const metadata = createPublicPageMetadata({
  title: "Search AI agent projects",
  description: "Search open-source AI agent listings by project name, category, description, tags, and setup details.",
  path: "/search",
});
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function SearchPage() {
  const [agents, categories] = await Promise.all([getAgents(), getCategories()]);
  const searchableAgents = agents.data.map(toSearchAgent);
  return <main id="main-content" className="page-shell search-page"><div className="container"><div className="page-heading search-page-heading"><p className="eyebrow">Agent directory</p><h1>Search AI agent projects.</h1></div>{agents.status === "unavailable" || !agents.data.length ? <CatalogState result={agents} itemLabel="published agents" emptyDescription="There are no published agents to search yet." /> : <Suspense fallback={<SearchContentSkeleton />}><SearchBox agents={searchableAgents} categories={categories.data} freshnessCutoff={getFreshnessCutoff()} /></Suspense>}</div></main>;
}
