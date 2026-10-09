"use client";

import { useLayoutEffect, useState } from "react";
import Sun from "reicon-react/icons/Sun";
import Moon from "reicon-react/icons/Moon";
import { updateVisitorPreferences, useVisitorPreferences } from "@/lib/visitor-preferences";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const { preferences } = useVisitorPreferences();
  const [sessionTheme, setSessionTheme] = useState<Theme | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const theme: Theme = sessionTheme ?? preferences.theme ?? "light";

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  async function toggleTheme() {
    const current = theme;
    const next: Theme = current === "dark" ? "light" : "dark";
    setSessionTheme(next);
    setSaveFailed(false);
    try {
      await updateVisitorPreferences({ theme: next });
      setSessionTheme(null);
    } catch (error) {
      console.error("Theme preference could not be saved", error);
      setSaveFailed(true);
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
