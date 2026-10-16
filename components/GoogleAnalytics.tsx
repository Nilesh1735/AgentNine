"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useVisitorPreferences } from "@/lib/visitor-preferences";
import {
  GOOGLE_ANALYTICS_MEASUREMENT_ID,
  getSafePageLocation,
  getSafePageReferrer,
  hasGoogleAnalyticsConsent,
  loadGoogleAnalyticsScript,
  queueGoogleAnalyticsCommand,
  shouldTrackPageView,
} from "@/lib/google-analytics";

export function GoogleAnalytics() {
  const pathname = usePathname();
  const { preferences, ready } = useVisitorPreferences();
  const consented = hasGoogleAnalyticsConsent(preferences);
  const initialized = useRef(false);
  const previouslyConsented = useRef(false);
  const lastTrackedPath = useRef<string | null>(null);
  const lastTrackedLocation = useRef<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!consented) {
      if (previouslyConsented.current) {
        queueGoogleAnalyticsCommand("consent", "update", {
          analytics_storage: "denied",
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
        });
      }
      previouslyConsented.current = false;
      lastTrackedPath.current = null;
      lastTrackedLocation.current = null;
      return;
    }

    if (!shouldTrackPageView(pathname)) {
      lastTrackedPath.current = null;
      return;
    }

    const pageLocation = getSafePageLocation(
      window.location.origin,
      pathname,
      window.location.search,
    );
    const pageReferrer = lastTrackedLocation.current
      ?? getSafePageReferrer(document.referrer, window.location.origin);
    const pageContext = {
      send_page_view: false,
      page_location: pageLocation,
      page_path: pathname,
      page_referrer: pageReferrer ?? "",
    };

    if (!initialized.current) {
      queueGoogleAnalyticsCommand("consent", "default", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
      queueGoogleAnalyticsCommand("js", new Date());
      queueGoogleAnalyticsCommand("config", GOOGLE_ANALYTICS_MEASUREMENT_ID, {
        ...pageContext,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        cookie_expires: 15_552_000,
        cookie_update: false,
      });
      loadGoogleAnalyticsScript();
      initialized.current = true;
    } else if (lastTrackedPath.current !== pathname) {
      queueGoogleAnalyticsCommand("config", GOOGLE_ANALYTICS_MEASUREMENT_ID, pageContext);
    }

    if (!previouslyConsented.current) {
      queueGoogleAnalyticsCommand("consent", "update", {
        analytics_storage: "granted",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    }
    previouslyConsented.current = true;
    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;
    lastTrackedLocation.current = pageLocation;
    queueGoogleAnalyticsCommand("event", "page_view", {
      page_title: document.title,
      page_location: pageLocation,
      page_path: pathname,
      page_referrer: pageReferrer ?? "",
    });
  }, [consented, pathname, ready]);

  return null;
}
