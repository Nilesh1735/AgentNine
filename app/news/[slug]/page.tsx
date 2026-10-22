import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { getPublishedNewsPost } from "@/lib/news";
import { createPublicPageMetadata } from "@/lib/seo";
import { serializeJsonLd } from "@/lib/json-ld";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(new Date(value));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedNewsPost(slug);
  if (!post) {
    return { title: "News article not found", robots: { index: false, follow: false } };
  }
  return createPublicPageMetadata({
    title: post.title,
    description: post.summary,
    path: `/news/${post.slug}`,
    type: "article",
    robots: { index: true, follow: true },
  });
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublishedNewsPost(slug);
  if (!post) notFound();

  const articleUrl = `${SITE_URL}/news/${post.slug}`;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": articleUrl,
    mainEntityOfPage: articleUrl,
    headline: post.title,
    description: post.summary,
    author: { "@type": "Person", name: post.author_name },
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "AgentNine",
      url: SITE_URL,
    },
    ...(post.published_at ? { datePublished: post.published_at } : {}),
    dateModified: post.updated_at,
  };

  return (
    <main id="main-content" className="page-shell news-article-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleJsonLd) }} />
      <article className="container news-article">
        <Link className="news-back-link" href="/news">All news</Link>
        <header className="news-article-heading">
          <h1>{post.title}</h1>
          <p className="news-byline">
            By {post.author_name}
            {post.published_at ? <> <span aria-hidden="true">·</span> <time dateTime={post.published_at}>{formatDate(post.published_at)}</time></> : null}
          </p>
          <p className="news-article-summary">{post.summary}</p>
        </header>
        <div className="news-article-body">
          <ReactMarkdown>{post.content_markdown}</ReactMarkdown>
        </div>
        {post.source_urls.length ? (
          <footer className="news-sources">
            <h2>Sources</h2>
            <ul>
              {post.source_urls.map((source) => (
                <li key={source}><a href={source} target="_blank" rel="noopener noreferrer">{new URL(source).hostname}</a></li>
              ))}
            </ul>
          </footer>
        ) : null}
      </article>
    </main>
  );
}
