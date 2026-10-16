"use client";

import { loadVisitorPreferences } from "@/lib/visitor-preferences";
import {
  getSafePageLocation,
  hasGoogleAnalyticsConsent,
  queueGoogleAnalyticsCommand,
  shouldTrackPageView,
} from "@/lib/google-analytics";

type AnalyticsEvent =
  | "agent_view"
  | "directory_search"
  | "search_success"
  | "search_zero_results"
  | "feedback_submitted"
  | "source_click"
  | "agent_saved"
  | "comparison_changed";

type AnalyticsProperty = string | number | boolean;

const allowedProperties: Record<AnalyticsEvent, ReadonlySet<string>> = {
  agent_view: new Set(["slug"]),
  directory_search: new Set(["queryLength", "filterCount"]),
  search_success: new Set(["resultCount"]),
  search_zero_results: new Set(["filterCount"]),
  feedback_submitted: new Set(["helpful"]),
  source_click: new Set(["slug"]),
  agent_saved: new Set(["slug", "action"]),
  comparison_changed: new Set(["slug", "action", "selectionCount"]),
};

export function trackEvent(
  eventName: AnalyticsEvent,
  properties: Record<string, AnalyticsProperty> = {},
) {
  void loadVisitorPreferences()
    .then((preferences) => {
      if (!hasGoogleAnalyticsConsent(preferences) || !shouldTrackPageView(window.location.pathname)) return;
      const allowed = allowedProperties[eventName];
      const safeProperties = Object.fromEntries(
        Object.entries(properties).filter(([key, value]) =>
          allowed.has(key)
          && ["string", "number", "boolean"].includes(typeof value)
          && (typeof value !== "string" || value.length <= 120),
        ),
      );
      const pageLocation = getSafePageLocation(
        window.location.origin,
        window.location.pathname,
        window.location.search,
      );
      queueGoogleAnalyticsCommand("event", eventName, {
        ...safeProperties,
        page_location: pageLocation,
        page_path: window.location.pathname,
      });
    })
    .catch((error: unknown) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("Google Analytics event was not queued", error);
      }
    });
}

export function trackEvents(events: Array<{
  eventName: AnalyticsEvent;
  properties?: Record<string, AnalyticsProperty>;
}>) {
  for (const event of events) trackEvent(event.eventName, event.properties);
}
