import { describe, expect, it } from "vitest";
import { validateNewsPostInput } from "../lib/news-post-validation";

const validPost = {
  title: "A useful AI update",
  slug: "a-useful-ai-update",
  summary: "A short summary of an AI project update.",
  content_markdown: "# What's new\n\nA **useful** update.",
  author_name: "Ali Sibtain",
  source_urls: ["https://example.com/release"],
  status: "draft",
};

describe("news post validation", () => {
  it("accepts a complete draft with HTTPS sources", () => {
    expect(validateNewsPostInput(validPost)).toEqual({
      ok: true,
      value: validPost,
    });
  });

  it("rejects malformed slugs and duplicate-prone empty slugs", () => {
    expect(validateNewsPostInput({ ...validPost, slug: "../draft" })).toEqual({
      ok: false,
      error: "Use a lowercase URL slug with letters, numbers, and hyphens.",
    });
  });

  it("rejects non-HTTPS sources and credentials in source URLs", () => {
    expect(validateNewsPostInput({ ...validPost, source_urls: ["http://example.com"] }).ok).toBe(false);
    expect(validateNewsPostInput({ ...validPost, source_urls: ["https://user:pass@example.com"] }).ok).toBe(false);
  });

  it("rejects invalid status and oversized article content", () => {
    expect(validateNewsPostInput({ ...validPost, status: "public" }).ok).toBe(false);
    expect(validateNewsPostInput({ ...validPost, content_markdown: "x".repeat(100_001) }).ok).toBe(false);
  });
});
