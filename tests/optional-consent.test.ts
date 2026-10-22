import { describe, expect, it } from "vitest";
import {
  OPTIONAL_CONSENT_VERSION,
  hasCurrentOptionalConsentChoices,
  hasOptionalAnalyticsConsent,
  hasOptionalMarketingConsent,
} from "@/lib/optional-consent";

describe("optional consent categories", () => {
  it("gates Analytics and Marketing independently", () => {
    const analyticsOnly = {
      analyticsConsent: "accepted" as const,
      analyticsConsentVersion: OPTIONAL_CONSENT_VERSION,
      marketingConsent: "declined" as const,
      marketingConsentVersion: OPTIONAL_CONSENT_VERSION,
    };

    expect(hasOptionalAnalyticsConsent(analyticsOnly)).toBe(true);
    expect(hasOptionalMarketingConsent(analyticsOnly)).toBe(false);
    expect(hasCurrentOptionalConsentChoices(analyticsOnly)).toBe(true);
  });

  it("allows Marketing without enabling Analytics", () => {
    const marketingOnly = {
      analyticsConsent: "declined" as const,
      analyticsConsentVersion: OPTIONAL_CONSENT_VERSION,
      marketingConsent: "accepted" as const,
      marketingConsentVersion: OPTIONAL_CONSENT_VERSION,
    };

    expect(hasOptionalAnalyticsConsent(marketingOnly)).toBe(false);
    expect(hasOptionalMarketingConsent(marketingOnly)).toBe(true);
    expect(hasCurrentOptionalConsentChoices(marketingOnly)).toBe(true);
  });

  it("requires a current choice for both categories before dismissing the banner", () => {
    expect(hasCurrentOptionalConsentChoices({
      analyticsConsent: "accepted",
      analyticsConsentVersion: OPTIONAL_CONSENT_VERSION,
    })).toBe(false);
    expect(hasCurrentOptionalConsentChoices({
      analyticsConsent: "accepted",
      analyticsConsentVersion: "analytics-ga4-meta-pixel-cortality-v3",
      marketingConsent: "declined",
      marketingConsentVersion: OPTIONAL_CONSENT_VERSION,
    })).toBe(false);
  });

  it("does not carry legacy bundled consent into the new category choices", () => {
    const legacyChoice = {
      analyticsConsent: "accepted" as const,
      analyticsConsentVersion: "analytics-ga4-meta-pixel-cortality-v3",
    };

    expect(hasOptionalAnalyticsConsent(legacyChoice)).toBe(false);
    expect(hasOptionalMarketingConsent(legacyChoice)).toBe(false);
  });
});
