"use client";

import { captureUtmParameters } from "@/lib/analytics";
import { updateVisitorPreferences } from "@/lib/visitor-preferences";

export async function saveAnalyticsConsent(value: "accepted" | "declined") {
  await updateVisitorPreferences(value === "accepted"
    ? { analyticsConsent: value }
    : { analyticsConsent: value, analyticsSessionId: null, attribution: null });

  if (value === "accepted") {
    try {
      await captureUtmParameters();
    } catch (error) {
      console.error("Campaign attribution could not be saved", error);
    }
  }
}
