"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ConsentBanner } from "@/components/ConsentBanner";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import ArrowUp from "reicon-react/icons/ArrowUp";
import { getPreferredScrollBehavior } from "@/lib/reduced-motion";

export function SiteUtilities() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const showFloatingContact = !["/login", "/signup", "/forgot-password", "/reset-password"].includes(pathname);
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
    <GoogleAnalytics />
    <ConsentBanner />
    <div className="site-utilities">
      {showFloatingContact ? <Link className="floating-contact" href="/contact" aria-label="Contact AgentNine">Contact</Link> : null}
      {showTop ? <button className="back-to-top" type="button" onClick={() => window.scrollTo({ top: 0, behavior: getPreferredScrollBehavior() })}><ArrowUp size={14} aria-hidden="true" /><span>Top</span></button> : null}
    </div>
  </>;
}
