export const FEEDBACK_PAGE_LAST_MODIFIED = "2026-10-19";

export function getSitemapLastModified(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? new Date(timestamp) : undefined;
}

export function getLatestSitemapLastModified(values: readonly (string | null | undefined)[]): Date | undefined {
  let latest: Date | undefined;
  for (const value of values) {
    const parsed = getSitemapLastModified(value);
    if (parsed && (!latest || parsed > latest)) latest = parsed;
  }
  return latest;
}
