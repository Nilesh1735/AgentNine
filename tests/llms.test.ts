import { describe, expect, it } from "vitest";
import { createLlmIndex } from "../lib/llms";
import type { Agent, Category } from "../lib/types";

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
  verification_score: 3,
} satisfies Pick<Agent, "category_id" | "name" | "slug" | "short_description" | "verification_score">;

describe("llms.txt index", () => {
  it("describes public content with canonical URLs and precise checklist language", () => {
    const index = createLlmIndex({
      agents: [agent],
      categories: [category],
      siteUrl: "https://agentnine.pro",
    });

    expect(index).toContain("[Research](https://agentnine.pro/categories/research)");
    expect(index).toContain("[Research Agent](https://agentnine.pro/agents/research-agent)");
    expect(index).toContain("AgentNine checklist evidence: 3/5");
    expect(index).toContain("not an independent security, legal, licensing, or operational certification");
    expect(index).not.toContain("/search");
    expect(index).not.toMatch(/verification 3\/5/);
  });
});
