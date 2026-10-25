import { describe, expect, it } from "vitest";
import { createLlmIndex } from "../lib/llms";
import type { Agent, Category } from "../lib/types";
import type { TrustAgent } from "../lib/trust";

const category = {
  id: "category-id",
  name: "Research",
  slug: "research",
  description: "Projects for research workflows.",
} satisfies Category;

const agent = {
  name: "Research Agent",
  slug: "research-agent",
  short_description: "An agent for research workflows.",
  category_id: category.id,
  verification_score: 5,
  status: "published",
  is_archived: false,
  metadata_is_stale: false,
  metadata_last_checked_at: null,
  last_commit_at: "",
  last_verified_date: "2026-10-25",
  upstream_changed_since_verification: false,
  upstream_is_archived: false,
  setup_guide: { source_url: "https://example.com/setup", checked_at: "2026-10-25" },
} satisfies Pick<Agent, "category_id" | "name" | "slug" | "short_description"> & TrustAgent;

describe("llms.txt index", () => {
  it("describes public content and the five-step setup verification accurately", () => {
    const index = createLlmIndex({
      agents: [agent],
      categories: [category],
      siteUrl: "https://agentnine.pro",
    });

    expect(index).toContain("[All agents](https://agentnine.pro/agents)");
    expect(index).toContain("[News](https://agentnine.pro/news)");
    expect(index).toContain("[Research](https://agentnine.pro/categories/research)");
    expect(index).toContain("[Research Agent](https://agentnine.pro/agents/research-agent)");
    expect(index).toContain("5/5 setup verification steps");
    expect(index).toContain("Verified");
    expect(index).not.toContain("Documented and Needs review");
    expect(index).toContain("not a security audit or security certification");
    expect(index).toContain("Needs review");
    expect(index).not.toContain("/search");
    expect(index).not.toMatch(/verification 3\/5/);
  });
});
