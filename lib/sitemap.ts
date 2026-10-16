export function getSitemapLastModified(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? new Date(timestamp) : undefined;
}
