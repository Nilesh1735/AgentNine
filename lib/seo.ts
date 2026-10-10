import type { Metadata } from "next";
import { SITE_URL } from "./site";

type PublicPageMetadata = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
};

function normalizeDescription(description: string): string {
  const normalized = description.replace(/\s+/g, " ").trim();
  if (normalized.length <= 160) return normalized;

  const truncated = normalized.slice(0, 157);
  const wordBoundary = truncated.lastIndexOf(" ");
  return `${truncated.slice(0, wordBoundary > 0 ? wordBoundary : truncated.length).trimEnd()}...`;
}

export function createPublicPageMetadata({
  title,
  description,
  path,
  type = "website",
}: PublicPageMetadata): Metadata {
  const canonicalUrl = new URL(path, SITE_URL).toString();
  const metaDescription = normalizeDescription(description);
  const socialTitle = `${title} | AgentNine`;
  const imageUrl = new URL("/og-image.png", SITE_URL).toString();

  return {
    title,
    description: metaDescription,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: socialTitle,
      description: metaDescription,
      type,
      url: canonicalUrl,
      siteName: "AgentNine",
      images: [{
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: socialTitle,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: metaDescription,
      images: [imageUrl],
    },
  };
}
