import type { Agent, Category } from "@/lib/types";

type LlmCatalog = {
  agents: Pick<Agent, "category_id" | "name" | "slug" | "short_description" | "verification_score">[];
  categories: Category[];
  siteUrl: string;
};

export function createLlmIndex({ agents, categories, siteUrl }: LlmCatalog): string {
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const lines = [
    "# AgentNine",
    "",
    "> Compare AI agent projects by source, setup requirements, and documented access.",
    "",
    "## Public pages",
    `- [Home](${siteUrl}/): recently updated AI agent listings`,
    `- [All agents](${siteUrl}/agents): a flat list of published agent setup guides`,
    `- [News](${siteUrl}/news): AI news and analysis`,
    `- [Categories](${siteUrl}/categories): browse listings by category`,
    `- [About](${siteUrl}/about): curation and removal policy`,
    `- [FAQ](${siteUrl}/faq): usage and verification FAQ`,
    "",
    "## Published categories",
    ...categories.map((category) =>
      `- [${category.name}](${siteUrl}/categories/${category.slug}): ${category.description}`,
    ),
    "",
    "## Published agents",
    ...agents.map((agent) => {
      const category = categoryById.get(agent.category_id);
      const evidence = `AgentNine checklist evidence: ${agent.verification_score}/5`;
      return `- [${agent.name}](${siteUrl}/agents/${agent.slug}): ${agent.short_description} (${category?.name ?? "Uncategorized"}; ${evidence})`;
    }),
    "",
    "## Trust boundary",
    "Checklist evidence records information available to AgentNine; it is not an independent security, legal, licensing, or operational certification. Listings can be incomplete or out of date. Review the project, its license, and current setup instructions; pin a version before running it.",
  ];
  return lines.join("\n");
}
