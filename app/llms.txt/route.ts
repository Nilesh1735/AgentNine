import { getAgents, getCategories } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const [agents, categories] = await Promise.all([getAgents(), getCategories()]);
  const categoryById = new Map(categories.data.map((category) => [category.id, category.name]));
  const lines = [
    "# AgentNine",
    "",
    "> Compare AI agent projects by source, setup requirements, and documented access.",
    "",
    "## Public pages",
    "- /: homepage and recently updated listings",
    "- /search: client-side catalog search with URL-synced filters",
    "- /categories: category directory",
    "- /about: curation and removal policy",
    "- /faq: usage and verification FAQ",
    "",
    "## Published agents",
    ...agents.data.map((agent) => `- [${agent.name}](/agents/${agent.slug}): ${agent.short_description} (${categoryById.get(agent.category_id) ?? "Uncategorized"}; verification ${agent.verification_score}/5)`),
    "",
    "## Trust boundary",
    "AgentNine is independent. Listings are not security, legal, licensing, or operational certifications. Recorded details can be incomplete or out of date. Review the upstream project, its license, and current setup instructions; pin a version before running it.",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}
