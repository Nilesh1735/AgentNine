"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { captureUtmParameters } from "@/lib/analytics";
import { ConsentBanner } from "@/components/ConsentBanner";
import ArrowUp from "reicon-react/icons/ArrowUp";

export function SiteUtilities() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const showFloatingContact = !["/login", "/signup", "/forgot-password", "/reset-password"].includes(pathname);
  useEffect(() => {
    void captureUtmParameters().catch((error: unknown) => {
      console.error("Campaign attribution could not be saved", error);
    });
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
    <ConsentBanner />
    <div className="site-utilities">
      {showFloatingContact ? <Link className="floating-contact" href="/contact" aria-label="Contact AgentNine">Contact</Link> : null}
      {showTop ? <button className="back-to-top" type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><ArrowUp size={14} aria-hidden="true" /><span>Top</span></button> : null}
    </div>
  </>;
}
