export const STATIC_PAGE_LAST_MODIFIED = {
  about: "2026-10-19",
  faq: "2026-10-17",
  join: "2026-10-09",
  contact: "2026-10-12",
  methodology: "2026-10-17",
} as const;

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
