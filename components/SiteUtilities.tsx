"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ConsentBanner } from "@/components/ConsentBanner";
import ArrowUp from "reicon-react/icons/ArrowUp";
import { getPreferredScrollBehavior } from "@/lib/reduced-motion";
import { hasOptionalAnalyticsConsent, hasOptionalMarketingConsent } from "@/lib/optional-consent";
import { useVisitorPreferences } from "@/lib/visitor-preferences";

const GoogleAnalytics = dynamic(
  () => import("@/components/GoogleAnalytics").then((module) => module.GoogleAnalytics),
  { ssr: false },
);
const MetaPixel = dynamic(
  () => import("@/components/MetaPixel").then((module) => module.MetaPixel),
  { ssr: false },
);
const CortalityReplay = dynamic(
  () => import("@/components/CortalityReplay").then((module) => module.CortalityReplay),
  { ssr: false },
);

export function SiteUtilities() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const [loadAnalyticsTools, setLoadAnalyticsTools] = useState(false);
  const [loadMarketingTools, setLoadMarketingTools] = useState(false);
  const { preferences, ready } = useVisitorPreferences();
  const showFloatingContact = !["/login", "/signup", "/forgot-password", "/reset-password"].includes(pathname);

  useEffect(() => {
    if (!ready) return;
    if (hasOptionalAnalyticsConsent(preferences)) setLoadAnalyticsTools(true);
    if (hasOptionalMarketingConsent(preferences)) setLoadMarketingTools(true);
  }, [preferences, ready]);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(100, Math.round((window.scrollY / scrollable) * 100)) : 0);
      setShowTop(window.scrollY > 480);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return <>
    <div className="scroll-progress" style={{ transform: `scaleX(${progress / 100})` }} aria-hidden="true" />
    {loadAnalyticsTools ? <><GoogleAnalytics /><CortalityReplay /></> : null}
    {loadMarketingTools ? <MetaPixel /> : null}
    <ConsentBanner />
    <div className="site-utilities">
      {showFloatingContact ? <Link className="floating-contact" href="/contact" aria-label="Contact AgentNine">Contact</Link> : null}
      {showTop ? <button className="back-to-top" type="button" onClick={() => window.scrollTo({ top: 0, behavior: getPreferredScrollBehavior() })}><ArrowUp size={14} aria-hidden="true" /><span>Top</span></button> : null}
    </div>
  </>;
}
