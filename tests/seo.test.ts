import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createPublicPageMetadata } from "../lib/seo";

describe("public page SEO metadata", () => {
  it("uses the apex site origin for canonicals and social metadata", () => {
    const metadata = createPublicPageMetadata({
      title: "AI agent categories",
      description: "Browse AI agent projects by category.",
      path: "/categories",
    });

    expect(metadata.alternates?.canonical).toBe("https://agentnine.pro/categories");
    expect(metadata.openGraph).toMatchObject({
      title: "AI agent categories | AgentNine",
      url: "https://agentnine.pro/categories",
      type: "website",
    });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it.each([
    ["/about", "/social-previews/og-about.png"],
    ["/agents", "/social-previews/og-agents.png"],
    ["/categories", "/social-previews/og-categories.png"],
    ["/categories/automation", "/social-previews/og-categories-automation.png"],
    ["/categories/coding", "/social-previews/og-categories-coding.png"],
    ["/categories/content", "/social-previews/og-categories-content.png"],
    ["/categories/research", "/social-previews/og-categories-research.png"],
    ["/contact", "/social-previews/og-contact.png"],
    ["/cookies", "/social-previews/og-cookies.png"],
    ["/faq", "/social-previews/og-faq.png"],
    ["/feedback", "/social-previews/og-feedback.png"],
    ["/join", "/social-previews/og-join.png"],
    ["/methodology", "/social-previews/og-methodology.png"],
    ["/news", "/social-previews/og-news.png"],
    ["/news/agentnine-news-article", "/social-previews/og-news.png"],
    ["/privacy", "/social-previews/og-privacy.png"],
    ["/privacy/choices", "/social-previews/og-privacy-choices.png"],
    ["/search", "/social-previews/og-search.png"],
    ["/terms", "/social-previews/og-terms.png"],
  ])("uses the supplied page-specific image for %s", (path, imagePath) => {
    expect(existsSync(join(process.cwd(), "public", imagePath.slice(1)))).toBe(true);

    const metadata = createPublicPageMetadata({
      title: "Page title",
      description: "Page description.",
      path,
    });
    const imageUrl = `https://agentnine.pro${imagePath}`;

    expect(metadata.openGraph?.images).toMatchObject([{
      url: imageUrl,
      width: 1463,
      height: 768,
    }]);
    expect(metadata.twitter?.images).toEqual([imageUrl]);
  });

  it("keeps the shared preview image for routes without a supplied page-specific image", () => {
    const metadata = createPublicPageMetadata({
      title: "Agent listing",
      description: "An AI agent listing.",
      path: "/agents/example",
    });

    expect(metadata.openGraph?.images).toMatchObject([{
      url: "https://agentnine.pro/og-image.png",
      width: 1200,
      height: 630,
    }]);
    expect(metadata.twitter?.images).toEqual(["https://agentnine.pro/og-image.png"]);
  });

  it("uses an agent-specific generated image when the page supplies one", () => {
    const metadata = createPublicPageMetadata({
      title: "Codebuff AI Agent Setup Guide",
      description: "Review Codebuff's setup guide.",
      path: "/agents/codebuff",
      socialImagePath: "/social-preview/agents/codebuff",
    });

    expect(metadata.openGraph?.images).toMatchObject([{
      url: "https://agentnine.pro/social-preview/agents/codebuff",
      width: 1200,
      height: 630,
      alt: "Codebuff AI Agent Setup Guide | AgentNine",
    }]);
    expect(metadata.twitter?.images).toEqual([
      "https://agentnine.pro/social-preview/agents/codebuff",
    ]);
  });
});
