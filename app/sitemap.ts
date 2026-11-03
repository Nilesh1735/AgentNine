import type { MetadataRoute } from "next";
import { getAgents, getCategories } from "@/lib/data";
import { getPublishedNewsPosts } from "@/lib/news";
import {
  getLatestSitemapLastModified,
  getSitemapLastModified,
} from "@/lib/sitemap";
import { getLatestPublishedSiteFeedbackUpdate } from "@/lib/site-feedback-data";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function withTimeout<T>(operation: Promise<T>, ms = 5000): Promise<T> {
  let timeout: ReturnType<typeof setTimeout>;
  return Promise.race([
    operation,
    new Promise<never>((_, reject) => {
      timeout = setTimeout(() => reject(new Error("Sitemap data retrieval timed out")), ms);
    }),
  ]).finally(() => clearTimeout(timeout));
}

async function loadSitemapSection<T>(name: string, operation: Promise<T>, fallback: T): Promise<T> {
  try {
    return await withTimeout(operation);
  } catch (error) {
    console.error(`Sitemap could not load ${name}; omitting those URLs:`, error);
    return fallback;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [agentsResult, categoriesResult, newsPosts, latestPublishedFeedbackUpdate] = await Promise.all([
    loadSitemapSection("agents", getAgents(), null),
    loadSitemapSection("categories", getCategories(), null),
    loadSitemapSection("news", getPublishedNewsPosts(), []),
    loadSitemapSection("published feedback timestamp", getLatestPublishedSiteFeedbackUpdate(), undefined),
  ]);

  const base = SITE_URL;
  const agents = agentsResult?.status === "ready" ? agentsResult.data : [];
  const categories = categoriesResult?.status === "ready" ? categoriesResult.data : [];
  if (agentsResult && agentsResult.status === "unavailable") {
    console.error("Sitemap could not load agents; omitting agent URLs:", agentsResult.errorCode);
  }
  if (categoriesResult && categoriesResult.status === "unavailable") {
    console.error("Sitemap could not load categories; omitting category URLs:", categoriesResult.errorCode);
  }
  const latestAgentUpdate = getLatestSitemapLastModified(agents.map((agent) => agent.updated_at));
  const latestHomeUpdate = getLatestSitemapLastModified([
    ...agents.map((agent) => agent.updated_at),
    latestPublishedFeedbackUpdate?.toISOString(),
  ]);
  const latestNewsUpdate = getLatestSitemapLastModified(
    newsPosts.map((post) => post.updated_at ?? post.published_at ?? post.created_at),
  );
  return [
    { url: base, ...(latestHomeUpdate ? { lastModified: latestHomeUpdate } : {}), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/agents`, ...(latestAgentUpdate ? { lastModified: latestAgentUpdate } : {}), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/news`, ...(latestNewsUpdate ? { lastModified: latestNewsUpdate } : {}), changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/categories`, ...(latestAgentUpdate ? { lastModified: latestAgentUpdate } : {}), changeFrequency: "weekly", priority: 0.8 },
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
