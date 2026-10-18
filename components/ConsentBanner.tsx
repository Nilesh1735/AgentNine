"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { saveAnalyticsConsent } from "@/lib/analytics-consent";
import { useVisitorPreferences } from "@/lib/visitor-preferences";
import { hasCurrentOptionalAnalyticsChoice } from "@/lib/google-analytics";
import Link from "next/link";

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
    } catch (saveError) {
      console.error("Analytics preference could not be saved", saveError);
      setError("Your privacy choice could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const visible = pathname !== "/privacy/choices" && ready && !hasCurrentOptionalAnalyticsChoice(preferences);
  if (!visible || !ready) return null;
  return (
    <aside className="consent-banner" aria-label="Optional analytics and session replay preferences">
      <div>
        <strong>Privacy choices</strong>
        <p>Allow optional Google Analytics, Meta Pixel, and Cortality session replay on the public pages described in our <Link href="/privacy">Privacy policy</Link>. They stay off unless allowed.</p>
      </div>
      <div className="consent-actions">
        <button type="button" className="button button-outline" aria-label="Decline optional analytics and session replay" disabled={saving} onClick={() => void choose("declined")}>Decline</button>
        <button type="button" className="button button-dark" aria-label="Allow optional analytics and session replay" disabled={saving} onClick={() => void choose("accepted")}>Allow</button>
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </aside>
  );
}
