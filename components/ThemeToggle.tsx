"use client";

import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import Sun from "reicon-react/icons/Sun";
import Moon from "reicon-react/icons/Moon";
import { isPreferencesServiceUnavailable, updateVisitorPreferences, useVisitorPreferences } from "@/lib/visitor-preferences";
import { decideTheme, readAppliedTheme, writeThemeCookie } from "@/lib/theme-boot";
import { transitionTheme } from "@/lib/theme-transition";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const { preferences } = useVisitorPreferences();
  const [sessionTheme, setSessionTheme] = useState<Theme | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const writeVersionRef = useRef(0);
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

  async function toggleTheme(event: MouseEvent<HTMLButtonElement>) {
    const writeVersion = ++writeVersionRef.current;
    const next: Theme = theme === "dark" ? "light" : "dark";
    const bounds = event.currentTarget.getBoundingClientRect();
    const origin = event.detail === 0
      ? { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 }
      : { x: event.clientX, y: event.clientY };
    setSaveFailed(false);
    // Mirror immediately so the change survives a navigation mid-save.
    writeThemeCookie(next);
    transitionTheme(
      { x: origin.x, y: origin.y },
      () => flushSync(() => {
        setSessionTheme(next);
        document.documentElement.dataset.theme = next;
      }),
    );
    try {
      await updateVisitorPreferences({ theme: next });
      if (writeVersion === writeVersionRef.current) setSessionTheme(null);
    } catch (error) {
      if (isPreferencesServiceUnavailable(error)) {
        console.warn("Theme changed and saved in this browser, but could not be synced to preferences.");
      } else {
        console.error("Theme preference could not be saved", error);
      }
      if (writeVersion === writeVersionRef.current) setSaveFailed(true);
    }
  }

  return (
    <>
      <button
        className="theme-toggle"
        type="button"
        onClick={(event) => void toggleTheme(event)}
        aria-pressed={theme === "dark"}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme${saveFailed ? ". Saved in this browser, but could not be synced" : ""}`}
        title={saveFailed ? "Theme saved in this browser, but could not be synced to preferences." : undefined}
      >
        <span className="theme-toggle-icon" aria-hidden="true">{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</span>
      </button>
      <span className="sr-only" role="status">
        {saveFailed ? "Theme saved in this browser, but could not be synced to your preferences." : ""}
      </span>
    </>
  );
}
