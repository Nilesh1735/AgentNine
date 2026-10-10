import { SearchBox } from "@/components/SearchBox";
import { CatalogState } from "@/components/CatalogState";
import { getAgents, getCategories, getFreshnessCutoff } from "@/lib/data";
import { Suspense } from "react";
import { SearchContentSkeleton } from "@/components/SearchContentSkeleton";
import { createPublicPageMetadata } from "@/lib/seo";

export const metadata = createPublicPageMetadata({
  title: "Search AI agent projects",
  description: "Search listings by project name, category, description, or tags.",
  path: "/search",
});
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function SearchPage() {
  const [agents, categories] = await Promise.all([getAgents(), getCategories()]);
  return <main id="main-content" className="page-shell search-page"><div className="container"><div className="page-heading search-page-heading"><p className="eyebrow">Agent directory</p><h1>Search AI agent projects.</h1></div>{agents.status === "unavailable" || !agents.data.length ? <CatalogState result={agents} itemLabel="published agents" emptyDescription="There are no published agents to search yet." /> : <Suspense fallback={<SearchContentSkeleton />}><SearchBox agents={agents.data} categories={categories.data} freshnessCutoff={getFreshnessCutoff()} /></Suspense>}</div></main>;
}
