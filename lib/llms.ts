import type { Agent, Category } from "@/lib/types";
import { getAgentTrustState, type TrustAgent } from "@/lib/trust";

type LlmCatalog = {
  agents: Array<Pick<Agent, "category_id" | "name" | "slug" | "short_description" | "verification_score"> & TrustAgent>;
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
      const trust = getAgentTrustState(agent);
      return `- [${agent.name}](${siteUrl}/agents/${agent.slug}): ${agent.short_description} (${category?.name ?? "Uncategorized"}; ${agent.verification_score}/5 setup verification steps; ${trust.label})`;
    }),
    "",
    "## Trust boundary",
    "The setup verification score records completion of AgentNine's five-step setup review process. It is not a security audit or security certification. Verified and Needs review describe the setup-verification and repository-freshness state. Review the project's license and current setup instructions; pin a version before running it.",
  ];
  return lines.join("\n");
}
