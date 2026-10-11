export const legalConfig = {
  operatorName: "Nilesh Raj (trading as AgentNine)",
  city: "Varanasi",
  governingLaw: "India",
  visitorCookieName: "agentnine_visitor",
  authCookieLifetime: "up to about 400 days",
  liabilityCap: "INR 10,000",
  lastUpdated: "October 12, 2026",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "info@agentnine.pro",
  upstashEnabled: true,
  resendEnabled: true,
} as const;

const unfilledFields = Object.entries(legalConfig)
  .filter(([key, value]) => key !== "contactEmail" && typeof value === "string" && value.startsWith("["))
  .map(([key]) => key);

if (
  process.env.NODE_ENV === "production" &&
  process.env.ALLOW_LEGAL_PLACEHOLDERS !== "1" &&
  unfilledFields.length > 0
) {
  throw new Error(
    `Legal configuration contains unfilled public statements: ${unfilledFields.join(", ")}. ` +
    "Complete lib/legal-config.ts before production. ALLOW_LEGAL_PLACEHOLDERS=1 is for preview builds only.",
  );
}
