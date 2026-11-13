import Link from "next/link";
import ArrowRight from "reicon-react/icons/ArrowRight";
import { CatalogState } from "@/components/CatalogState";
import { getCategories, getAgents, getCategoryAgentCount } from "@/lib/data";
import { createPublicPageMetadata } from "@/lib/seo";
import { serializeJsonLd } from "@/lib/json-ld";
import { SITE_URL } from "@/lib/site";

export const metadata = createPublicPageMetadata({
  title: "Open-Source AI Agent Categories: Setup Guides",
  description: "Find open-source AI tools for coding, research, automation, and content. Browse agent categories and review project sources, setup, and access details.",
  path: "/categories",
});

export default async function CategoriesPage() {
  const [categories, agents] = await Promise.all([getCategories(), getAgents()]);
  const catalogUnavailable = categories.status === "unavailable" || agents.status === "unavailable";
  const unavailableResult = categories.status === "unavailable" ? categories : agents;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/categories`,
    url: `${SITE_URL}/categories`,
    name: "Open-source AI agent categories",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: categories.data.length,
      itemListElement: categories.data.map((category, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: category.name,
        url: `${SITE_URL}/categories/${category.slug}`,
        item: `${SITE_URL}/categories/${category.slug}`,
      })),
    },
  };

  return (
    <main id="main-content" className="page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <div className="container">
        <div className="page-heading">
          <p className="eyebrow">Categories</p>
          <h1>Choose a use case.</h1>
          <p>
            Explore open-source AI agent projects by use case, including coding, research, content,
            and automation. Each category links to project pages with source, setup, and access
            details where available.
          </p>
        </div>
        {catalogUnavailable ? (
          <CatalogState
            result={unavailableResult}
            itemLabel={categories.status === "unavailable" ? "categories" : "published agents"}
            emptyDescription="Categories will appear here once the catalog has been populated."
          />
        ) : !categories.data.length ? (
          <CatalogState
            result={categories}
            itemLabel="categories"
            emptyDescription="Categories will appear here once the catalog has been populated."
          />
        ) : (
          <div className="agent-grid">
            {categories.data.map((category) => {
              const count = getCategoryAgentCount(agents.data, category);
              return (
                <Link href={`/categories/${category.slug}`} className="agent-card" key={category.id}>
                  <span className="eyebrow">{String(count).padStart(2, "0")} agents</span>
                  <h3>{category.name}</h3>
                  <p>{category.description}</p>
                  <span className="text-link" style={{ marginTop: "auto" }}>
                    Browse category <ArrowRight size={14} aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
