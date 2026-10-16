import Link from "next/link";
import { getPublishedNewsPosts } from "@/lib/news";
import { createPublicPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = createPublicPageMetadata({
  title: "AI news and analysis",
  description: "News, explainers, and updates on open-source AI agents and the tools around them.",
  path: "/news",
});

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(new Date(value));
}

export default async function NewsPage() {
  const posts = await getPublishedNewsPosts();

  return (
    <main id="main-content" className="page-shell news-page">
      <div className="container">
        <header className="page-heading news-heading">
          <h1>News and analysis.</h1>
          <p>Updates and reporting on open-source AI agents and the tools around them.</p>
        </header>
        {posts.length ? (
          <ol className="news-list">
            {posts.map((post) => (
              <li key={post.id}>
                <article>
                  {post.published_at ? <time dateTime={post.published_at}>{formatDate(post.published_at)}</time> : null}
                  <h2><Link href={`/news/${post.slug}`}>{post.title}</Link></h2>
                  <p className="news-summary">{post.summary}</p>
                  <p className="news-byline">By {post.author_name}</p>
                </article>
              </li>
            ))}
          </ol>
        ) : (
          <p className="news-empty">No news articles have been published yet.</p>
        )}
      </div>
    </main>
  );
}
