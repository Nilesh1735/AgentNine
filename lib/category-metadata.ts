import type { Category } from "./types";

const FALLBACK_TITLE = "Open-source AI agent category";
const FALLBACK_DESCRIPTION =
  "Explore open-source AI agents by category, with source repositories, setup guidance, and documented system access.";

export function getCategoryMetadata(category: Pick<Category, "name" | "description"> | undefined) {
  const name = category?.name.trim().replace(/\s+/g, " ");
  if (!name) return { title: FALLBACK_TITLE, description: FALLBACK_DESCRIPTION };

  const categoryType = name.replace(/\s+agents?$/i, "").trim() || name;
  const subject = `${categoryType.toLowerCase().replace(/\bai\b/g, "AI")} agents`;
  const description = category?.description?.trim();

  return {
    title: `Open-source ${subject}: setup guides`,
    description: description
      ? `Explore ${subject} by source, setup requirements, and documented access. ${description}`
      : `Explore ${subject} by source, setup requirements, and documented access.`,
  };
}
