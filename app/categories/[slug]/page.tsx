import { notFound } from "next/navigation";
import { AgentCard } from "@/components/AgentCard";
import { CategoryNav } from "@/components/CategoryNav";
import { CatalogState } from "@/components/CatalogState";
import { getAgents, getCategories, getCategory, getCategoryAgents } from "@/lib/data";
import { serializeJsonLd } from "@/lib/json-ld";
import { createPublicPageMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const result = await getCategories();
  return result.status === "ready"
    ? result.data.map((category) => ({ slug: category.slug }))
    : [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategory(slug);
  const title = category?.name ? `${category.name}: setup and access` : "AI agent category";
  const description = category?.description
    ? `${category.description} Browse source links, setup guidance, and documented system access.`
    : "Browse AI agent projects by category and review their source and setup details.";
  return createPublicPageMetadata({ title, description, path: `/categories/${slug}` });
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const [category, categories, agents] = await Promise.all([getCategory(slug), getCategories(), getAgents()]);
  if (!category) notFound();
  const categoryAgents = getCategoryAgents(agents.data, category);
  const categoryUrl = `${SITE_URL}/categories/${category.slug}`;
  const categoryTitle = `${category.name}: setup and access`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": categoryUrl,
        url: categoryUrl,
        name: categoryTitle,
        description: category.description,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: categoryAgents.length,
          itemListElement: categoryAgents.map((agent, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: agent.name,
            url: `${SITE_URL}/agents/${agent.slug}`,
            item: `${SITE_URL}/agents/${agent.slug}`,
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Categories", item: `${SITE_URL}/categories` },
          { "@type": "ListItem", position: 3, name: category.name, item: categoryUrl },
        ],
      },
    ],
  };
  return <main id="main-content" className="page-shell"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} /><div className="container browse-layout"><CategoryNav categories={categories.data} active={slug} /><div><div className="page-heading"><p className="eyebrow">Category</p><h1>{category.name}</h1><p>{category.description}</p></div>{agents.status === "unavailable" || !categoryAgents.length ? <CatalogState result={agents} itemLabel="published agents" emptyDescription="No projects in this category have been published yet." /> : <div className="agent-grid">{categoryAgents.map((agent) => <AgentCard key={agent.id} agent={agent} category={category} />)}</div>}</div></div></main>;
}
