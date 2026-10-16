export function getDirectSearchScore(name: string, searchableText: string, query: string): number | null {
  const normalizedName = name.toLowerCase();
  const normalizedText = searchableText.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  if (!normalizedText.includes(normalizedQuery)) return null;
  return normalizedName.includes(normalizedQuery) ? 0 : 0.2;
}
