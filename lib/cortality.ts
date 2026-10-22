import type { VisitorPreferences } from "@/lib/visitor-preferences";
import { hasOptionalAnalyticsConsent } from "@/lib/optional-consent";

const CORTALITY_SCRIPT_URL = "https://cdn.cortality.com/c.js";

const exactPublicPaths = new Set([
  "/",
  "/agents",
  "/categories",
  "/faq",
  "/about",
  "/methodology",
  "/news",
  "/terms",
  "/privacy",
  "/cookies",
  "/search",
  "/compare",
  "/contact",
  "/join",
]);
const allowedOrigins = new Set(["https://agentnine.pro", "https://www.agentnine.pro"]);

export function hasCortalityConsent(preferences: VisitorPreferences): boolean {
  return hasOptionalAnalyticsConsent(preferences);
}

export function isCortalityPublicPath(pathname: string): boolean {
  if (pathname === "/news/editor") return false;
  return exactPublicPaths.has(pathname)
    || /^\/agents\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pathname)
    || /^\/categories\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pathname)
    || /^\/news\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pathname);
}

export function canLoadCortality(pathname: string, search: string, hash: string): boolean {
  const queryAllowed = ["/search", "/compare", "/contact", "/join"].includes(pathname);
  return isCortalityPublicPath(pathname) && (!search || queryAllowed) && !hash;
}

export function canUseCortalityForRequest(pathname: string, search: string, origin: string): boolean {
  return canLoadCortality(pathname, search, "") && allowedOrigins.has(origin);
}

export function canLoadCortalityAtLocation(pathname: string, search: string, hash: string, origin: string): boolean {
  return canLoadCortality(pathname, search, hash) && allowedOrigins.has(origin);
}

type CortalityWindow = Window & {
  Cortality?: {
    init(options: { siteId: string; endpoint: string }): void;
  };
  __agentnineCortalityInitialized?: boolean;
};

export function loadCortality() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const cortalityWindow = window as CortalityWindow;
  if (cortalityWindow.__agentnineCortalityInitialized) return;

  const initialize = () => {
    if (cortalityWindow.__agentnineCortalityInitialized) return;
    if (!cortalityWindow.Cortality) {
      console.error("Cortality session replay loaded without its initialization API");
      return;
    }
    cortalityWindow.__agentnineCortalityInitialized = true;
    try {
      cortalityWindow.Cortality.init({
        siteId: "op_agentnine",
        endpoint: "https://ingest.cortality.com/v1/sessions",
      });
    } catch (error) {
      console.error("Cortality session replay could not be initialized", error);
    }
  };

  const script = document.querySelector<HTMLScriptElement>(`script[src="${CORTALITY_SCRIPT_URL}"]`)
    ?? document.createElement("script");

  if (!script.isConnected) {
    script.src = CORTALITY_SCRIPT_URL;
    script.async = true;
    script.addEventListener("load", () => {
      if (document.readyState === "complete") initialize();
      else window.addEventListener("load", initialize, { once: true });
    }, { once: true });
    script.addEventListener("error", () => {
      console.error("Cortality session replay script could not be loaded");
    }, { once: true });
    document.head.appendChild(script);
  } else if (document.readyState === "complete") {
    initialize();
  } else {
    window.addEventListener("load", initialize, { once: true });
  }
}
