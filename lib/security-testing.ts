const SECURITY_TESTING_TAGS = [
  "security testing",
  "penetration test",
  "pentest",
  "red team",
  "offensive security",
];

export function isSecurityTestingTool(tags: readonly string[]): boolean {
  return tags.some((tag) => {
    const normalizedTag = tag.trim().toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
    return SECURITY_TESTING_TAGS.some((securityTag) => normalizedTag.includes(securityTag));
  });
}

export function hasAuthorizedUseDescription(tags: readonly string[], description: string): boolean {
  return !isSecurityTestingTool(tags) || /\bauthorized\b/i.test(description);
}
