import Link from "next/link";
import ArrowRight from "reicon-react/icons/ArrowRight";
import { CatalogState } from "@/components/CatalogState";
import { getCategories, getAgents, getCategoryAgentCount } from "@/lib/data";

export const metadata = { title: "AI agent categories", description: "Browse AI-agent projects by coding, research, automation, and content.", alternates: { canonical: "/categories" } };

export default async function CategoriesPage() {
  const [categories, agents] = await Promise.all([getCategories(), getAgents()]);
  const catalogUnavailable = categories.status === "unavailable" || agents.status === "unavailable";
  const unavailableResult = categories.status === "unavailable" ? categories : agents;
  return <main id="main-content" className="page-shell"><div className="container"><div className="page-heading"><p className="eyebrow">Categories</p><h1>Choose a use case.</h1></div>{catalogUnavailable ? <CatalogState result={unavailableResult} itemLabel={categories.status === "unavailable" ? "categories" : "published agents"} emptyDescription="Categories will appear here once the catalog has been populated." /> : !categories.data.length ? <CatalogState result={categories} itemLabel="categories" emptyDescription="Categories will appear here once the catalog has been populated." /> : <div className="agent-grid">{categories.data.map((category) => { const count = getCategoryAgentCount(agents.data, category); return <Link href={`/categories/${category.slug}`} className="agent-card" key={category.id}><span className="eyebrow">{String(count).padStart(2, "0")} agents</span><h3>{category.name}</h3><p>{category.description}</p><span className="text-link" style={{ marginTop: "auto" }}>Browse category <ArrowRight size={14} aria-hidden="true" /></span></Link>; })}</div>}</div></main>;
}
