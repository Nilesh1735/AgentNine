"use client";

import { updateVisitorPreferences } from "@/lib/visitor-preferences";
import { GOOGLE_ANALYTICS_CONSENT_VERSION } from "@/lib/google-analytics";

export async function saveAnalyticsConsent(value: "accepted" | "declined") {
  await updateVisitorPreferences({
    analyticsConsent: value,
    analyticsConsentVersion: GOOGLE_ANALYTICS_CONSENT_VERSION,
    analyticsSessionId: null,
    attribution: null,
  });
}
