"use client";

import { loadVisitorPreferences, updateVisitorPreferences } from "@/lib/visitor-preferences";

type AnalyticsEvent = "agent_view" | "search" | "search_success" | "search_zero_results" | "feedback_submitted" | "source_click" | "agent_saved" | "comparison_changed" | "api_error" | "admin_error";
type AnalyticsEventInput = {
  eventName: AnalyticsEvent;
  properties?: Record<string, string | number | boolean>;
};
let sessionCreation: Promise<string> | null = null;

export async function captureUtmParameters() {
  const preferences = await loadVisitorPreferences();
  if (preferences.analyticsConsent !== "accepted") return;
  const params = new URLSearchParams(window.location.search);
  const attribution: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
    const value = params.get(key);
    if (value) attribution[key] = value.slice(0, 120);
  }
  if (Object.keys(attribution).length) {
    await updateVisitorPreferences({ attribution });
  }
}

export function trackEvent(eventName: AnalyticsEvent, properties: Record<string, string | number | boolean> = {}) {
  trackEvents([{ eventName, properties }]);
}

export function trackEvents(events: AnalyticsEventInput[]) {
  if (!events.length) return;
  void submitEvents(events).catch((error: unknown) => {
    if (process.env.NODE_ENV === "development") console.warn("Analytics event was not recorded", error);
  });
}

async function submitEvents(events: AnalyticsEventInput[]) {
  const preferences = await loadVisitorPreferences();
  if (preferences.analyticsConsent !== "accepted") return;
  const sessionId = await getAnalyticsSessionId(preferences.analyticsSessionId);
  const current = await loadVisitorPreferences();
  if (current.analyticsConsent !== "accepted") return;
  const attribution = current.attribution ?? {};
  const payload = {
    consent: "accepted",
    events: events.map(({ eventName, properties = {} }) => ({
      eventName,
      properties: { ...attribution, ...properties },
    })),
    sessionId,
    pagePath: window.location.pathname.slice(0, 500),
  };
  const response = await fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  });
  if (!response.ok) throw new Error(`Analytics request failed (${response.status})`);
}

async function getAnalyticsSessionId(existing: string | undefined) {
  if (existing) return existing;
  if (!sessionCreation) {
    sessionCreation = updateVisitorPreferences({ analyticsSessionId: crypto.randomUUID() })
      .then((preferences) => {
        if (!preferences.analyticsSessionId) throw new Error("Analytics session ID was not saved");
        return preferences.analyticsSessionId;
      });
  }
  try {
    return await sessionCreation;
  } finally {
    sessionCreation = null;
  }
}
