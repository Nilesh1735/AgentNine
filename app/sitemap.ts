import type { MetadataRoute } from "next";
import { getAgents, getCategories } from "@/lib/data";
import { getPublishedNewsPosts } from "@/lib/news";
import {
  FEEDBACK_PAGE_LAST_MODIFIED,
  getLatestSitemapLastModified,
  getSitemapLastModified,
} from "@/lib/sitemap";
import { getLatestPublishedSiteFeedbackUpdate } from "@/lib/site-feedback-data";
import { legalConfig } from "@/lib/legal-config";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function withTimeout<T>(operation: Promise<T>, ms = 1500): Promise<T> {
  let timeout: ReturnType<typeof setTimeout>;
  return Promise.race([
    operation,
    new Promise<never>((_, reject) => {
      timeout = setTimeout(() => reject(new Error("Sitemap data retrieval timed out")), ms);
    }),
  ]).finally(() => clearTimeout(timeout));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [agentsResult, categoriesResult, newsPosts, latestPublishedFeedbackUpdate] = await Promise.all([
    withTimeout(getAgents()),
    withTimeout(getCategories()),
    withTimeout(getPublishedNewsPosts()),
    withTimeout(getLatestPublishedSiteFeedbackUpdate()),
  ]);
  if (agentsResult.status === "unavailable" || categoriesResult.status === "unavailable") {
    throw new Error("Cannot generate a complete sitemap while catalog data is unavailable");
  }

  const base = SITE_URL;
  const agents = agentsResult.data;
  const categories = categoriesResult.data;
  const latestAgentUpdate = getLatestSitemapLastModified(agents.map((agent) => agent.updated_at));
  const latestHomeUpdate = getLatestSitemapLastModified([
    ...agents.map((agent) => agent.updated_at),
    latestPublishedFeedbackUpdate?.toISOString(),
  ]);
  const latestNewsUpdate = getLatestSitemapLastModified(
    newsPosts.map((post) => post.updated_at ?? post.published_at ?? post.created_at),
  );
  const legalLastModified = getSitemapLastModified(legalConfig.lastUpdated);
  const feedbackPageLastModified = getSitemapLastModified(FEEDBACK_PAGE_LAST_MODIFIED);

  return [
    { url: base, ...(latestHomeUpdate ? { lastModified: latestHomeUpdate } : {}), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/agents`, ...(latestAgentUpdate ? { lastModified: latestAgentUpdate } : {}), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/news`, ...(latestNewsUpdate ? { lastModified: latestNewsUpdate } : {}), changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/categories`, ...(latestAgentUpdate ? { lastModified: latestAgentUpdate } : {}), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/methodology`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/join`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/faq`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/feedback`, ...(feedbackPageLastModified ? { lastModified: feedbackPageLastModified } : {}), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/privacy`, ...(legalLastModified ? { lastModified: legalLastModified } : {}), changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/cookies`, ...(legalLastModified ? { lastModified: legalLastModified } : {}), changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, ...(legalLastModified ? { lastModified: legalLastModified } : {}), changeFrequency: "yearly", priority: 0.2 },
    ...categories.map((category) => {
      const categoryLastModified = getLatestSitemapLastModified(
        agents.filter((agent) => agent.category_id === category.id).map((agent) => agent.updated_at),
      );
      return {
        url: `${base}/categories/${category.slug}`,
        ...(categoryLastModified ? { lastModified: categoryLastModified } : {}),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      };
    }),
    ...newsPosts.map((post) => {
      const lastModified = getSitemapLastModified(post.updated_at ?? post.published_at ?? post.created_at);
      return {
        url: `${base}/news/${post.slug}`,
        ...(lastModified ? { lastModified } : {}),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      };
    }),
    ...agents.map((agent) => {
      const lastModified = getSitemapLastModified(agent.updated_at);
      return {
        url: `${base}/agents/${agent.slug}`,
        ...(lastModified ? { lastModified } : {}),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      };
    }),
  ];
}
