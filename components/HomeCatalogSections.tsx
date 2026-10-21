import Link from "next/link";
import ArrowUpRight from "reicon-react/icons/ArrowUpRight";
import { CatalogState } from "@/components/CatalogState";
import { DirectoryPreview } from "@/components/DirectoryPreview";
import { getAgents, getCategories } from "@/lib/data";
import { getPublishedNewsPosts } from "@/lib/news";
import { serializeJsonLd } from "@/lib/json-ld";
import { SITE_URL } from "@/lib/site";
import { getAgentTrustState } from "@/lib/trust";
import { selectHomepagePreviewAgents } from "@/lib/homepage-preview";

export async function HomeCatalogSections() {
  const [agents, categories, news] = await Promise.all([
    getAgents(),
    getCategories(),
    getPublishedNewsPosts().then(
      (posts) => ({ status: "ready" as const, posts }),
      (error: unknown) => {
        console.error("Homepage news section could not load published posts:", error);
        return { status: "unavailable" as const, posts: [] };
      },
    ),
  ]);
  const featured = agents.data.slice(0, 3);
  const latestNews = news.posts.slice(0, 3);
  const previewAgents = selectHomepagePreviewAgents(agents.data, categories.data).map((agent) => {
    const trust = getAgentTrustState(agent);
    return {
      id: agent.id,
      name: agent.name,
      slug: agent.slug,
      category_id: agent.category_id,
      short_description: agent.short_description,
      version_tag: agent.version_tag,
      trust: { key: trust.key, label: trust.label, className: trust.className },
    };
  });
  const previewCategories = categories.data.map(({ id, name, slug }) => ({ id, name, slug }));
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
          : <DirectoryPreview agents={previewAgents} categories={previewCategories} />}
      </section>
      <section className="category-band">
        <div className="container">
          <div className="band-heading"><p className="eyebrow">Categories</p><h2>Browse projects by category.</h2></div>
          <div className="category-links">{categories.data.map((category) => <Link key={category.id} href={`/categories/${category.slug}`}><span>{category.name}</span>{category.description ? <small>{category.description}</small> : null}<ArrowUpRight size={15} aria-hidden="true" /></Link>)}</div>
        </div>
      </section>
      <section className="section home-news-section" aria-labelledby="home-news-heading">
        <div className="container">
          <div className="home-news-heading">
            <h2 id="home-news-heading">News and updates.</h2>
            <Link href="/news" className="home-news-all-link">
              All news <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>
          {news.status === "unavailable" ? (
            <p className="news-empty">News is temporarily unavailable. Please try again later.</p>
          ) : latestNews.length ? (
            <ol className="news-list home-news-list">
              {latestNews.map((post) => (
                <li key={post.id}>
                  <article>
                    {post.published_at ? (
                      <time dateTime={post.published_at}>
                        {new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(new Date(post.published_at))}
                      </time>
                    ) : null}
                    <h3><Link href={`/news/${post.slug}`}>{post.title}</Link></h3>
                    <p className="news-summary">{post.summary}</p>
                  </article>
                </li>
              ))}
            </ol>
          ) : (
            <p className="news-empty">No news articles have been published yet.</p>
          )}
        </div>
      </section>
    </>
  );
}
