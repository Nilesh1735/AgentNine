import type { MetadataRoute } from "next";
import { getAgents, getCategories } from "@/lib/data";
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
  const [agentsResult, categoriesResult] = await Promise.all([
    withTimeout(getAgents()),
    withTimeout(getCategories()),
  ]);
  if (agentsResult.status === "unavailable" || categoriesResult.status === "unavailable") {
    throw new Error("Cannot generate a complete sitemap while catalog data is unavailable");
  }

  const base = SITE_URL;
  const agents = agentsResult.data;
  const categories = categoriesResult.data;
  const agentLastModified = (agent: (typeof agents)[number]) => {
    const dates = [agent.last_verified_date, agent.metadata_last_checked_at]
      .filter((value): value is string => Boolean(value) && value !== "Not verified")
      .map((value) => new Date(value))
      .filter((date) => !Number.isNaN(date.getTime()));
    return dates.length
      ? new Date(Math.max(...dates.map((date) => date.getTime())))
      : undefined;
  };

  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/search`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/categories`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/methodology`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/join`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/faq`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/cookies`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/refunds`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
    ...categories.map((category) => ({ url: `${base}/categories/${category.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...agents.map((agent) => {
      const lastModified = agentLastModified(agent);
      return {
        url: `${base}/agents/${agent.slug}`,
        ...(lastModified ? { lastModified } : {}),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      };
    }),
  ];
}
