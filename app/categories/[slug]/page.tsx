import { notFound } from "next/navigation";
import { AgentCard } from "@/components/AgentCard";
import { CategoryNav } from "@/components/CategoryNav";
import { CatalogState } from "@/components/CatalogState";
import { getAgents, getCategories, getCategory, getCategoryAgents } from "@/lib/data";
import { serializeJsonLd } from "@/lib/json-ld";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const category = await getCategory((await params).slug);
  return { title: category?.name ? `${category.name} AI agent projects` : "AI agent category", description: category?.description ?? "Browse projects in this category.", alternates: { canonical: `/categories/${(await params).slug}` } };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const [category, categories, agents] = await Promise.all([getCategory(slug), getCategories(), getAgents()]);
  if (!category) notFound();
  const categoryAgents = getCategoryAgents(agents.data, category);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const jsonLd = { "@context": "https://schema.org", "@type": "CollectionPage", name: `${category.name} AI agent projects`, description: category.description, ...(baseUrl ? { url: `${baseUrl}/categories/${category.slug}` } : {}), mainEntity: { "@type": "ItemList", numberOfItems: categoryAgents.length, itemListElement: categoryAgents.map((agent, index) => ({ "@type": "ListItem", position: index + 1, name: agent.name, ...(baseUrl ? { url: `${baseUrl}/agents/${agent.slug}` } : {}) })) } };
  return <main id="main-content" className="page-shell"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} /><div className="container browse-layout"><CategoryNav categories={categories.data} active={slug} /><div><div className="page-heading"><p className="eyebrow">Category</p><h1>{category.name}</h1><p>{category.description}</p></div>{agents.status === "unavailable" || !categoryAgents.length ? <CatalogState result={agents} itemLabel="published agents" emptyDescription="No projects in this category have been published yet." /> : <div className="agent-grid">{categoryAgents.map((agent) => <AgentCard key={agent.id} agent={agent} category={category} />)}</div>}</div></div></main>;
}
