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
});
