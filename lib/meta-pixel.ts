import { shouldTrackPageView } from "@/lib/google-analytics";

export const META_PIXEL_ID = "927600866897675";

type MetaPixelFunction = ((...parameters: unknown[]) => void) & {
  queue: unknown[][];
  loaded: boolean;
  version: string;
  push: (...parameters: unknown[]) => void;
};

declare global {
  interface Window {
    fbq?: MetaPixelFunction;
    _fbq?: MetaPixelFunction;
  }
}

function getMetaPixelFunction(): MetaPixelFunction {
  if (window.fbq) return window.fbq;

  const queue: unknown[][] = [];
  const fbq = (...parameters: unknown[]) => {
    queue.push(parameters);
  };
  const pixel = Object.assign(fbq, {
    queue,
    loaded: true,
    version: "2.0",
    push: fbq,
  });
  window.fbq = pixel;
  window._fbq = pixel;
  return pixel;
}

export function queueMetaPixelCommand(...parameters: unknown[]) {
  if (typeof window === "undefined") return;
  getMetaPixelFunction()(...parameters);
}

export function loadMetaPixelScript() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (document.querySelector(`script[data-agentnine-meta-pixel="${META_PIXEL_ID}"]`)) return;

  const script = document.createElement("script");
  script.async = true;
  script.dataset.agentnineMetaPixel = META_PIXEL_ID;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
}

const campaignParameters = new Set(["utm_source", "utm_medium", "utm_campaign"]);

function hasOnlyCampaignParameters(search: string): boolean {
  const parameters = new URLSearchParams(search);
  return [...parameters.keys()].every((key) => campaignParameters.has(key));
}

function hasSafeReferrer(referrer: string, origin: string): boolean {
  if (!referrer) return true;
  try {
    const parsed = new URL(referrer);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    if (!hasOnlyCampaignParameters(parsed.search)) return false;
    if (parsed.origin === origin) return shouldTrackMetaPageView(parsed.pathname, parsed.search, "", origin);
    return true;
  } catch {
    return false;
  }
}

export function shouldTrackMetaPageView(
  pathname: string,
  search: string,
  referrer: string,
  origin: string,
): boolean {
  return pathname !== "/search"
    && shouldTrackPageView(pathname)
    && hasOnlyCampaignParameters(search)
    && hasSafeReferrer(referrer, origin);
}
