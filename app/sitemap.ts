import type { MetadataRoute } from "next";
import { getAgents, getCategories } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function withTimeout<T>(operation: Promise<T>, ms = 1500): Promise<T | undefined> {
  return Promise.race([
    operation,
    new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), ms)),
  ]);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [agentsResult, categoriesResult] = await Promise.all([
    withTimeout(getAgents()),
    withTimeout(getCategories()),
  ]);

  const base = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://agentnine.pro").replace(/\/$/, "");
  const agents = agentsResult?.status === "ready" ? agentsResult.data : [];
  const categories = categoriesResult?.status === "ready" ? categoriesResult.data : [];

  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/search`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/categories`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/faq`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/cookies`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/refunds`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
    ...categories.map((category) => ({ url: `${base}/categories/${category.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...agents.map((agent) => ({ url: `${base}/agents/${agent.slug}`, ...(agent.last_verified_date !== "Not verified" ? { lastModified: agent.last_verified_date } : {}), changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
