"use client";

import { useEffect, useState } from "react";
import { saveAnalyticsConsent } from "@/lib/analytics-consent";
import {
  loadVisitorPreferences,
  useVisitorPreferences,
} from "@/lib/visitor-preferences";

export function AnalyticsPrivacyChoices() {
  const { preferences, ready } = useVisitorPreferences();
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    void loadVisitorPreferences().catch((error: unknown) => {
      console.error("Privacy choices could not be loaded", error);
      setLoadError(true);
    });
  }, []);

  async function choose(value: "accepted" | "declined") {
    setSaving(true);
    setSaveError("");
    setSavedMessage("");
    try {
      await saveAnalyticsConsent(value);
      setSavedMessage("Your privacy choice has been saved.");
      window.dispatchEvent(new CustomEvent("agentnine-consent-change"));
    } catch (error) {
      console.error("Privacy choice could not be saved", error);
      setSaveError("Your privacy choice could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function retryLoad() {
    setLoadError(false);
    try {
      await loadVisitorPreferences();
    } catch (error) {
      console.error("Privacy choices could not be loaded", error);
      setLoadError(true);
    }
  }

  const currentChoice = preferences.analyticsConsent;

  return (
    <section className="privacy-choice-controls" aria-labelledby="privacy-choice-heading">
      <h2 id="privacy-choice-heading">Optional analytics</h2>
      <p>
        Analytics is {currentChoice === "accepted" ? "allowed" : "off"}.
        {currentChoice
          ? " You can change this choice at any time."
          : " It stays off unless you choose to allow it."}
      </p>
      {loadError ? (
        <div role="alert">
          <p className="form-error">Your current choice could not be loaded.</p>
          <button className="button button-outline" type="button" onClick={() => void retryLoad()}>
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="privacy-choice-actions">
            <button
              className="button button-outline"
              type="button"
              aria-pressed={currentChoice === "declined"}
              disabled={!ready || saving}
              onClick={() => void choose("declined")}
            >
              Decline
            </button>
            <button
              className="button button-dark"
              type="button"
              aria-pressed={currentChoice === "accepted"}
              disabled={!ready || saving}
              onClick={() => void choose("accepted")}
            >
              Allow
            </button>
          </div>
          {!ready ? <p role="status">Loading your current choice…</p> : null}
          {saving ? <p role="status">Saving your choice…</p> : null}
          {savedMessage ? <p className="form-success" role="status">{savedMessage}</p> : null}
          {saveError ? <p className="form-error" role="alert">{saveError}</p> : null}
        </>
      )}
    </section>
  );
}
