"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { saveAnalyticsConsent } from "@/lib/analytics-consent";
import { useVisitorPreferences } from "@/lib/visitor-preferences";

export function ConsentBanner() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { preferences, ready } = useVisitorPreferences();
  const pathname = usePathname();

  async function choose(value: "accepted" | "declined") {
    setSaving(true);
    setError("");
    try {
      await saveAnalyticsConsent(value);
      window.dispatchEvent(new CustomEvent("agentnine-consent-change"));
    } catch (saveError) {
      console.error("Analytics preference could not be saved", saveError);
      setError("Your privacy choice could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const visible = pathname !== "/privacy/choices" && ready && !preferences.analyticsConsent;
  if (!visible || !ready) return null;
  return (
    <aside className="consent-banner" aria-label="Analytics preferences">
      <div>
        <strong>Privacy choices</strong>
        <p>Optional analytics helps us understand which pages are useful. It is off until you allow it, and the directory works without it.</p>
      </div>
      <div className="consent-actions">
        <button type="button" className="button button-outline" aria-label="Decline optional analytics" disabled={saving} onClick={() => void choose("declined")}>Decline</button>
        <button type="button" className="button button-dark" aria-label="Allow optional analytics" disabled={saving} onClick={() => void choose("accepted")}>Allow</button>
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </aside>
  );
}
