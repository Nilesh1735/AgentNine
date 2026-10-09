const CATEGORY_ARTWORK: Record<string, number> = {
  automation: 1,
  coding: 3,
  content: 2,
  research: 0,
};

function getSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  }
  return hash >>> 0;
}

export function getAgentArtworkVariant(
  categorySlug: string | undefined,
  fallbackSeed: string,
): number {
  if (categorySlug && Object.hasOwn(CATEGORY_ARTWORK, categorySlug)) {
    return CATEGORY_ARTWORK[categorySlug];
  }
  return getSeed(categorySlug || fallbackSeed) % 4;
}
