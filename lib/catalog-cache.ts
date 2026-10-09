import { revalidateTag } from "next/cache";

export const CATALOG_AGENTS_TAG = "catalog:agents";
export const CATALOG_CATEGORIES_TAG = "catalog:categories";

export function invalidateCatalogAgents() {
  revalidateTag(CATALOG_AGENTS_TAG, { expire: 0 });
}
