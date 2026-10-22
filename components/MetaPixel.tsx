"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useVisitorPreferences } from "@/lib/visitor-preferences";
import { hasOptionalMarketingConsent } from "@/lib/optional-consent";
import {
  loadMetaPixelScript,
  META_PIXEL_ID,
  queueMetaPixelCommand,
  shouldTrackMetaPageView,
} from "@/lib/meta-pixel";

export function MetaPixel() {
  const pathname = usePathname();
  const { preferences, ready } = useVisitorPreferences();
  const consented = hasOptionalMarketingConsent(preferences);
  const initialized = useRef(false);
  const previouslyConsented = useRef(false);
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!consented) {
      if (previouslyConsented.current && initialized.current) {
        queueMetaPixelCommand("consent", "revoke");
      }
      previouslyConsented.current = false;
      lastTrackedPath.current = null;
      return;
    }

    if (
      window.location.hash
      || !shouldTrackMetaPageView(pathname, window.location.search, document.referrer, window.location.origin)
    ) {
      lastTrackedPath.current = null;
      return;
    }

    if (!initialized.current) {
      loadMetaPixelScript();
      queueMetaPixelCommand("init", META_PIXEL_ID);
      initialized.current = true;
    } else if (!previouslyConsented.current) {
      queueMetaPixelCommand("consent", "grant");
    }
    previouslyConsented.current = true;

    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;
    queueMetaPixelCommand("track", "PageView");
  }, [consented, pathname, ready]);

  return null;
}
