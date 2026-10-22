"use client";

import { updateVisitorPreferences } from "@/lib/visitor-preferences";
import { OPTIONAL_CONSENT_VERSION } from "@/lib/optional-consent";

export async function saveOptionalConsentChoices(
  analyticsConsent: "accepted" | "declined",
  marketingConsent: "accepted" | "declined",
) {
  await updateVisitorPreferences({
    analyticsConsent,
    analyticsConsentVersion: OPTIONAL_CONSENT_VERSION,
    marketingConsent,
    marketingConsentVersion: OPTIONAL_CONSENT_VERSION,
    analyticsSessionId: null,
    attribution: null,
  });
}
