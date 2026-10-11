import type { Metadata } from "next";
import { SITE_URL } from "./site";

type PublicPageMetadata = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
};

const DEFAULT_SOCIAL_IMAGE = "/og-image.png";
const SOCIAL_IMAGES_BY_PATH: Record<string, string> = {
  "/about": "/social-previews/og-about.png",
  "/categories": "/social-previews/og-categories.png",
  "/categories/automation": "/social-previews/og-categories-automation.png",
  "/categories/coding": "/social-previews/og-categories-coding.png",
  "/categories/content": "/social-previews/og-categories-content.png",
  "/categories/research": "/social-previews/og-categories-research.png",
  "/contact": "/social-previews/og-contact.png",
  "/cookies": "/social-previews/og-cookies.png",
  "/faq": "/social-previews/og-faq.png",
  "/join": "/social-previews/og-join.png",
  "/methodology": "/social-previews/og-methodology.png",
  "/privacy": "/social-previews/og-privacy.png",
  "/privacy/choices": "/social-previews/og-privacy-choices.png",
  "/refunds": "/social-previews/og-refunds.png",
  "/search": "/social-previews/og-search.png",
  "/terms": "/social-previews/og-terms.png",
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
  const imagePath = SOCIAL_IMAGES_BY_PATH[path] ?? DEFAULT_SOCIAL_IMAGE;
  const imageUrl = new URL(imagePath, SITE_URL).toString();
  const imageDimensions = imagePath === DEFAULT_SOCIAL_IMAGE
    ? { width: 1200, height: 630 }
    : { width: 1463, height: 768 };

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
        ...imageDimensions,
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
