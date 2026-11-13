import type { Metadata } from "next";
import { SITE_URL } from "./site";

type PublicPageMetadata = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  robots?: Metadata["robots"];
  socialImagePath?: string;
};

const DEFAULT_SOCIAL_IMAGE = "/og-image.png";
const TITLE_BRAND_SUFFIX = " | AgentNine";
const MAX_DESCRIPTION_LENGTH = 155;
const SOCIAL_IMAGES_BY_PATH: Record<string, string> = {
  "/about": "/social-previews/og-about.png",
  "/agents": "/social-previews/og-agents.png",
  "/categories": "/social-previews/og-categories.png",
  "/categories/automation": "/social-previews/og-categories-automation.png",
  "/categories/coding": "/social-previews/og-categories-coding.png",
  "/categories/content": "/social-previews/og-categories-content.png",
  "/categories/research": "/social-previews/og-categories-research.png",
  "/contact": "/social-previews/og-contact.png",
  "/cookies": "/social-previews/og-cookies.png",
  "/faq": "/social-previews/og-faq.png",
  "/feedback": "/social-previews/og-feedback.png",
  "/join": "/social-previews/og-join.png",
  "/methodology": "/social-previews/og-methodology.png",
  "/news": "/social-previews/og-news.png",
  "/privacy": "/social-previews/og-privacy.png",
  "/privacy/choices": "/social-previews/og-privacy-choices.png",
  "/search": "/social-previews/og-search.png",
  "/terms": "/social-previews/og-terms.png",
};

function normalizeDescription(description: string): string {
  const normalized = description.replace(/\s+/g, " ").trim();
  if (normalized.length <= MAX_DESCRIPTION_LENGTH) return normalized;

  const truncated = normalized.slice(0, MAX_DESCRIPTION_LENGTH - 3);
  const wordBoundary = truncated.lastIndexOf(" ");
  return `${truncated.slice(0, wordBoundary > 0 ? wordBoundary : truncated.length).trimEnd()}...`;
}

export function createAgentPageTitle(name: string): string {
  const title = `${name} AI Agent Setup Guide`;
  const brandedLength = title.length + TITLE_BRAND_SUFFIX.length;
  if (brandedLength >= 50) return title;

  const detailedTitle = `${name} AI Agent: Setup, Requirements & Access`;
  const detailedLength = detailedTitle.length + TITLE_BRAND_SUFFIX.length;
  if (detailedLength >= 50 && detailedLength <= 60) return detailedTitle;

  const conciseRequirementsTitle = `${name} AI Agent: Requirements`;
  const conciseRequirementsLength =
    conciseRequirementsTitle.length + TITLE_BRAND_SUFFIX.length;
  if (conciseRequirementsLength >= 50 && conciseRequirementsLength <= 60) {
    return conciseRequirementsTitle;
  }

  const setupRequirementsTitle = `${name} AI Agent: Setup & Requirements`;
  const setupRequirementsLength =
    setupRequirementsTitle.length + TITLE_BRAND_SUFFIX.length;
  if (setupRequirementsLength >= 50 && setupRequirementsLength <= 60) {
    return setupRequirementsTitle;
  }

  const requirementsTitle = `${title}: Requirements`;
  const requirementsLength = requirementsTitle.length + TITLE_BRAND_SUFFIX.length;
  return requirementsLength >= 50 && requirementsLength <= 60
    ? requirementsTitle
    : title;
}

export function createPublicPageMetadata({
  title,
  description,
  path,
  type = "website",
  robots,
  socialImagePath,
}: PublicPageMetadata): Metadata {
  const canonicalUrl = new URL(path, SITE_URL).toString();
  const metaDescription = normalizeDescription(description);
  const socialTitle = `${title} | AgentNine`;
  const imagePath = socialImagePath ?? SOCIAL_IMAGES_BY_PATH[path]
    ?? (path.startsWith("/news/") ? SOCIAL_IMAGES_BY_PATH["/news"] : DEFAULT_SOCIAL_IMAGE);
  const imageUrl = new URL(imagePath, SITE_URL).toString();
  const imageDimensions = socialImagePath || imagePath === DEFAULT_SOCIAL_IMAGE
    ? { width: 1200, height: 630 }
    : { width: 1463, height: 768 };

  return {
    title,
    description: metaDescription,
    ...(robots ? { robots } : {}),
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
