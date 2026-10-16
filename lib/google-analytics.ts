import type { VisitorPreferences } from "@/lib/visitor-preferences";

export const GOOGLE_ANALYTICS_MEASUREMENT_ID = "G-FG116C7C4W";
export const GOOGLE_ANALYTICS_CONSENT_VERSION = "ga4-v1";

type GtagCommand = [command: string, ...parameters: unknown[]];

declare global {
  interface Window {
    dataLayer?: GtagCommand[];
    gtag?: (...parameters: GtagCommand) => void;
  }
}

export function hasGoogleAnalyticsConsent(preferences: VisitorPreferences): boolean {
  return preferences.analyticsConsent === "accepted"
    && preferences.analyticsConsentVersion === GOOGLE_ANALYTICS_CONSENT_VERSION;
}

export function hasCurrentGoogleAnalyticsChoice(preferences: VisitorPreferences): boolean {
  return (preferences.analyticsConsent === "accepted" || preferences.analyticsConsent === "declined")
    && preferences.analyticsConsentVersion === GOOGLE_ANALYTICS_CONSENT_VERSION;
}

export function getSafePageLocation(
  origin: string,
  pathname: string,
  search: string,
): string {
  const page = new URL(pathname, origin);
  const parameters = new URLSearchParams(search);
  for (const key of ["utm_source", "utm_medium", "utm_campaign"]) {
    const value = parameters.get(key);
    if (value) page.searchParams.set(key, value.slice(0, 120));
  }
  return page.toString();
}

export function shouldTrackPageView(pathname: string): boolean {
  return ![
    "/admin",
    "/account",
    "/profile",
    "/news/editor",
    "/privacy/choices",
    "/auth",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ].some((excluded) => pathname === excluded || pathname.startsWith(`${excluded}/`));
}

export function getSafePageReferrer(referrer: string, sameOrigin?: string): string | undefined {
  if (!referrer) return undefined;
  try {
    const parsed = new URL(referrer);
    if ((parsed.protocol !== "https:" && parsed.protocol !== "http:") || parsed.origin === "null") {
      return undefined;
    }
    return parsed.origin === sameOrigin
      ? `${parsed.origin}${parsed.pathname}`
      : parsed.origin;
  } catch {
    return undefined;
  }
}

export function queueGoogleAnalyticsCommand(...parameters: GtagCommand) {
  if (typeof window === "undefined") return;
  window.dataLayer ??= [];
  window.gtag ??= (...command) => {
    window.dataLayer?.push(command);
  };
  window.gtag(...parameters);
}

export function loadGoogleAnalyticsScript() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  window.dataLayer ??= [];
  window.gtag ??= (...command) => {
    window.dataLayer?.push(command);
  };

  if (document.querySelector(`script[data-agentnine-ga="${GOOGLE_ANALYTICS_MEASUREMENT_ID}"]`)) return;

  const script = document.createElement("script");
  script.async = true;
  script.dataset.agentnineGa = GOOGLE_ANALYTICS_MEASUREMENT_ID;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_MEASUREMENT_ID}`;
  document.head.appendChild(script);
}
