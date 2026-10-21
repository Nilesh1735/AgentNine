import type { Agent, Category } from "./types";

export function selectHomepagePreviewAgents<T extends Pick<Agent, "category_id">>(
  agents: readonly T[],
  categories: readonly Pick<Category, "id">[],
): T[] {
  return categories.flatMap(({ id }) =>
    agents.filter((agent) => agent.category_id === id).slice(0, 6),
  );
}
