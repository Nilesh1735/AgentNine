export function normalizeAnalyticsPagePath(value: string) {
  return value.split(/[?#]/, 1)[0];
}
