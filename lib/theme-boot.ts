/**
 * Pre-paint theme resolution.
 *
 * Why an inline script rather than reading the cookie in the server layout: calling
 * cookies() in the root layout opts every route into dynamic rendering, which would
 * cost the prerendering the site currently relies on (x-nextjs-prerender / CDN HIT).
 * A blocking inline script in <head> sets the attribute before first paint and keeps
 * pages static.
 *
 * Note for later: this inline script depends on 'unsafe-inline' in script-src. If a
 * nonce-based CSP is ever adopted, this script needs that nonce.
 */

export const THEME_COOKIE_NAME = "agentnine_theme";

export type Theme = "light" | "dark";

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

/** Reads the mirrored theme cookie in the browser. Returns null when absent or invalid. */
export function readThemeCookie(): Theme | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)agentnine_theme=(light|dark)(?:;|$)/);
  return match && isTheme(match[1]) ? match[1] : null;
}

/**
 * The theme the boot script actually applied to the document.
 *
 * Clients must read this rather than assuming a default: the boot script may have
 * resolved "dark" from the operating system, and a component that falls back to
 * "light" would otherwise overwrite that during hydration and flip the page.
 */
export function readAppliedTheme(): Theme | null {
  if (typeof document === "undefined") return null;
  const applied = document.documentElement.dataset.theme;
  return isTheme(applied) ? applied : null;
}

/** Removes the mirrored cookie so the boot script falls back to the system preference. */
export function clearThemeCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${THEME_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

/**
 * Puts the mirrored cookie back to what it was before a failed save.
 *
 * `previous` must come from readThemeCookie, not readAppliedTheme: the applied
 * theme may have been resolved from the operating system with no cookie present,
 * and writing that value would pin a cookie the visitor never had, silently
 * stopping the page from following later system changes.
 */
export function restoreThemeCookie(previous: Theme | null) {
  if (previous) writeThemeCookie(previous);
  else clearThemeCookie();
}

export type ThemeDecision = {
  /** What the control should display. */
  displayed: Theme;
  /** What to write to the document, or null to leave the boot script's value alone. */
  documentWrite: Theme | null;
};

/**
 * Decides what the theme control shows and whether it touches the document.
 *
 * Exported so the behaviour is unit-testable without a DOM: the component holds no
 * copy of this logic, so a regression here fails the tests.
 *
 * `chosen` is an explicit choice (this session's toggle, or the stored preference).
 * `booted` is what the pre-paint script applied, which may be system-resolved dark.
 * Only an explicit choice writes to the document; otherwise the boot script's value
 * stands, which is what stops a system-dark page flipping to light on hydration.
 */
export function decideTheme(chosen: Theme | null, booted: Theme | null): ThemeDecision {
  return { displayed: chosen ?? booted ?? "light", documentWrite: chosen };
}

/**
 * Mirrors the stored theme into a readable cookie so the next navigation can apply it
 * before paint. Supabase remains the source of truth; this is only a paint-time cache.
 */
export function writeThemeCookie(theme: Theme) {
  if (typeof document === "undefined") return;
  // `location` is guarded separately: the document check alone does not promise a
  // window, and an unguarded dereference here would throw rather than skip.
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${THEME_COOKIE_NAME}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

/**
 * Runs before first paint. Prefers an explicit saved choice, otherwise follows the
 * operating system. Wrapped in try/catch because a blocked-cookie or restricted
 * environment must not stop the page rendering.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{
var m=document.cookie.match(/(?:^|;\\s*)agentnine_theme=(light|dark)(?:;|$)/);
var t=m?m[1]:(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
document.documentElement.dataset.theme=t;
}catch(e){}})();`;
