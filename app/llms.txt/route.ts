import { getAgents, getCategories } from "@/lib/data";
import { createLlmIndex } from "@/lib/llms";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET() {
  const [agents, categories] = await Promise.all([getAgents(), getCategories()]);
  if (agents.status === "unavailable" || categories.status === "unavailable") {
    return new Response("AgentNine's public catalog is temporarily unavailable. Please retry later.\n", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "Retry-After": "60",
      },
    });
  }

  return new Response(createLlmIndex({
    agents: agents.data,
    categories: categories.data,
    siteUrl: SITE_URL,
  }), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
