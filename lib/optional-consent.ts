import type { VisitorPreferences } from "@/lib/visitor-preferences";

export const OPTIONAL_CONSENT_VERSION = "optional-consent-categories-v4";

type ConsentChoice = "accepted" | "declined";

function isCurrentChoice(choice: string | undefined, version: string | undefined): choice is ConsentChoice {
  return (choice === "accepted" || choice === "declined")
    && version === OPTIONAL_CONSENT_VERSION;
}

export function hasOptionalAnalyticsConsent(preferences: VisitorPreferences): boolean {
  return preferences.analyticsConsent === "accepted"
    && preferences.analyticsConsentVersion === OPTIONAL_CONSENT_VERSION;
}

export function hasOptionalMarketingConsent(preferences: VisitorPreferences): boolean {
  return preferences.marketingConsent === "accepted"
    && preferences.marketingConsentVersion === OPTIONAL_CONSENT_VERSION;
}

export function hasCurrentOptionalConsentChoices(preferences: VisitorPreferences): boolean {
  return isCurrentChoice(preferences.analyticsConsent, preferences.analyticsConsentVersion)
    && isCurrentChoice(preferences.marketingConsent, preferences.marketingConsentVersion);
}
