import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://agentnine.pro").replace(/\/$/, "");
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/login", "/signup", "/api"] },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
