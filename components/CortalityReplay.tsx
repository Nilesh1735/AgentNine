"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useVisitorPreferences } from "@/lib/visitor-preferences";
import { canLoadCortalityAtLocation, hasCortalityConsent, loadCortality } from "@/lib/cortality";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type CortalityWindow = Window & { __agentnineCortalityInitialized?: boolean };

export function CortalityReplay() {
  const pathname = usePathname();
  const { preferences, ready } = useVisitorPreferences();
  const authState = useRef<"unknown" | "signed-in" | "signed-out">("unknown");
  const previousAuthState = useRef<"unknown" | "signed-in" | "signed-out">("unknown");
  const previousPageEligibility = useRef<boolean | null>(null);
  const previousConsent = useRef<boolean | null>(null);
  const [authRevision, setAuthRevision] = useState(0);

  useEffect(() => {
    if (!ready) return;
    const consented = hasCortalityConsent(preferences);
    if (previousConsent.current === true && !consented
      && (window as CortalityWindow).__agentnineCortalityInitialized) {
      window.location.reload();
      return;
    }
    previousConsent.current = consented;
  }, [preferences, ready]);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    let active = true;
    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        if (error.name === "AuthSessionMissingError") {
          authState.current = "signed-out";
          previousAuthState.current = "signed-out";
          setAuthRevision((revision) => revision + 1);
          return;
        }
        console.error("Cortality eligibility could not be verified", error);
        return;
      }
      authState.current = data.user ? "signed-in" : "signed-out";
      previousAuthState.current = authState.current;
      setAuthRevision((revision) => revision + 1);
    }).catch((error: unknown) => {
      if (!active) return;
      console.error("Cortality eligibility could not be verified", error);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextState = session?.user ? "signed-in" : "signed-out";
      authState.current = nextState;
      if (previousAuthState.current === "signed-out" && nextState === "signed-in"
        && (window as CortalityWindow).__agentnineCortalityInitialized) {
        window.location.reload();
      }
      previousAuthState.current = nextState;
      setAuthRevision((revision) => revision + 1);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const eligible = canLoadCortalityAtLocation(
      pathname,
      window.location.search,
      window.location.hash,
      window.location.origin,
    );
    const crossedPagePolicy = previousPageEligibility.current !== null
      && previousPageEligibility.current !== eligible;
    previousPageEligibility.current = eligible;
    if (!ready || !hasCortalityConsent(preferences) || authState.current !== "signed-out") return;
    if (crossedPagePolicy && eligible) {
      window.location.replace(window.location.href);
      return;
    }
    if (!eligible) return;

    const navigateToUntrackedPage = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target && anchor.target !== "_self") return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin
        || canLoadCortalityAtLocation(destination.pathname, destination.search, destination.hash, destination.origin)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.assign(destination.href);
    };
    const reloadWithoutFragmentTracking = () => window.location.reload();
    document.addEventListener("click", navigateToUntrackedPage, true);
    window.addEventListener("hashchange", reloadWithoutFragmentTracking);
    loadCortality();
    return () => {
      document.removeEventListener("click", navigateToUntrackedPage, true);
      window.removeEventListener("hashchange", reloadWithoutFragmentTracking);
    };
  }, [authRevision, pathname, preferences, ready]);

  return null;
}

export function CortalityRouteBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const initialized = typeof window !== "undefined"
    && Boolean((window as CortalityWindow).__agentnineCortalityInitialized);
  const canRemainTracked = typeof window !== "undefined"
    && canLoadCortalityAtLocation(pathname, window.location.search, window.location.hash, window.location.origin);

  useEffect(() => {
    if (!initialized || canRemainTracked) return;
    window.location.replace(window.location.href);
  }, [canRemainTracked, initialized]);

  if (initialized && !canRemainTracked) {
    return <div className="cortality-route-transition" role="status" aria-live="polite">Opening page…</div>;
  }
  return children;
}
