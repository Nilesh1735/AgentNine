"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Sun from "reicon-react/icons/Sun";
import Moon from "reicon-react/icons/Moon";
import { updateVisitorPreferences, useVisitorPreferences } from "@/lib/visitor-preferences";
import { decideTheme, readAppliedTheme, readThemeCookie, restoreThemeCookie, writeThemeCookie } from "@/lib/theme-boot";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const { preferences } = useVisitorPreferences();
  const [sessionTheme, setSessionTheme] = useState<Theme | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  // What the pre-paint script resolved, which may be "dark" from the operating
  // system. Read after mount so the first client render matches the server's and
  // hydration stays clean.
  const [bootTheme, setBootTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setBootTheme(readAppliedTheme());
  }, []);

  // An explicit choice: this session's toggle, or the stored preference.
  const chosenTheme: Theme | null = sessionTheme ?? preferences.theme ?? null;
  const { displayed: theme, documentWrite } = decideTheme(chosenTheme, bootTheme);

  useLayoutEffect(() => {
    // Null means the boot script's value stands. Writing a fallback here would
    // overwrite a system-resolved "dark" with "light" during hydration.
    if (!documentWrite) return;
    document.documentElement.dataset.theme = documentWrite;
  }, [documentWrite]);

  async function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    // The cookie as it stands, which may be absent while the page follows the
    // operating system. Reading the applied theme here would pin a cookie the
    // visitor never had if the save then failed.
    const previousCookieTheme = readThemeCookie();
    setSessionTheme(next);
    setSaveFailed(false);
    // Mirror immediately so the change survives a navigation mid-save.
    writeThemeCookie(next);
    try {
      await updateVisitorPreferences({ theme: next });
      setSessionTheme(null);
    } catch (error) {
      console.error("Theme preference could not be saved", error);
      setSaveFailed(true);
      // The failure message promises the choice resets on reload, so the mirror
      // must not outlive this visit. Restore exactly what was there before.
      restoreThemeCookie(previousCookieTheme);
    }
  }

  return (
    <>
      <button
        className="theme-toggle"
        type="button"
        onClick={toggleTheme}
        aria-pressed={theme === "dark"}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme${saveFailed ? ". This change could not be saved and will reset on reload" : ""}`}
        title={saveFailed ? "Theme changed for this visit, but could not be saved." : undefined}
      >
        <span className="theme-toggle-icon" aria-hidden="true">{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</span>
      </button>
      <span className="sr-only" role="status">
        {saveFailed ? "Theme changed for this visit, but the preference could not be saved. It will reset on reload." : ""}
      </span>
    </>
  );
}
