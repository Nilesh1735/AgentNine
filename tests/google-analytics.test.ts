import { describe, expect, it } from "vitest";
import {
  GOOGLE_ANALYTICS_CONSENT_VERSION,
  getSafePageLocation,
  getSafePageReferrer,
  hasCurrentGoogleAnalyticsChoice,
  hasGoogleAnalyticsConsent,
  shouldTrackPageView,
} from "@/lib/google-analytics";

describe("Google Analytics consent", () => {
  it("does not treat first-party analytics consent as consent to Google Analytics", () => {
    expect(hasGoogleAnalyticsConsent({ analyticsConsent: "accepted" })).toBe(false);
    expect(hasCurrentGoogleAnalyticsChoice({ analyticsConsent: "declined" })).toBe(false);
  });

  it("enables measurement only after the current consent version is accepted", () => {
    const accepted = {
      analyticsConsent: "accepted" as const,
      analyticsConsentVersion: GOOGLE_ANALYTICS_CONSENT_VERSION,
    };
    const declined = {
      analyticsConsent: "declined" as const,
      analyticsConsentVersion: GOOGLE_ANALYTICS_CONSENT_VERSION,
    };

    expect(hasGoogleAnalyticsConsent(accepted)).toBe(true);
    expect(hasCurrentGoogleAnalyticsChoice(accepted)).toBe(true);
    expect(hasGoogleAnalyticsConsent(declined)).toBe(false);
    expect(hasCurrentGoogleAnalyticsChoice(declined)).toBe(true);
  });
});

describe("Google Analytics URL privacy", () => {
  it("removes arbitrary query parameters and retains only limited campaign fields", () => {
    expect(getSafePageLocation(
      "https://agentnine.pro",
      "/search",
      "?q=private+search&category=coding&utm_source=newsletter&utm_term=private",
    )).toBe("https://agentnine.pro/search?utm_source=newsletter");
  });

  it("strips query and fragment data from same-origin referrers", () => {
    expect(getSafePageReferrer("https://agentnine.pro/search?q=private#results", "https://agentnine.pro"))
      .toBe("https://agentnine.pro/search");
    expect(getSafePageReferrer("https://external.example/private?q=secret", "https://agentnine.pro"))
      .toBe("https://external.example");
    expect(getSafePageReferrer("not a URL")).toBeUndefined();
    expect(getSafePageReferrer("javascript:alert(1)")).toBeUndefined();
  });
});

describe("Google Analytics page selection", () => {
  it("excludes private and authentication pages", () => {
    for (const path of ["/admin", "/admin/agents", "/account", "/profile", "/news/editor", "/privacy/choices", "/auth/callback", "/login", "/signup"]) {
      expect(shouldTrackPageView(path)).toBe(false);
    }
  });

  it("allows public content pages", () => {
    for (const path of ["/", "/agents", "/agents/aider", "/categories/coding", "/news"]) {
      expect(shouldTrackPageView(path)).toBe(true);
    }
  });
});
