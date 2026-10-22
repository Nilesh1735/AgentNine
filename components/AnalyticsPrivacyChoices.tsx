"use client";

import { useEffect, useState } from "react";
import { ConsentCategoryRow } from "@/components/ConsentCategoryRow";
import { saveOptionalConsentChoices } from "@/lib/analytics-consent";
import {
  hasOptionalAnalyticsConsent,
  hasOptionalMarketingConsent,
} from "@/lib/optional-consent";
import {
  loadVisitorPreferences,
  useVisitorPreferences,
} from "@/lib/visitor-preferences";

export function AnalyticsPrivacyChoices() {
  const { preferences, ready } = useVisitorPreferences();
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);
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

  useEffect(() => {
    setAnalyticsEnabled(hasOptionalAnalyticsConsent(preferences));
    setMarketingEnabled(hasOptionalMarketingConsent(preferences));
  }, [preferences]);

  async function saveChoices(analytics: boolean, marketing: boolean) {
    setSaving(true);
    setSaveError("");
    setSavedMessage("");
    try {
      await saveOptionalConsentChoices(
        analytics ? "accepted" : "declined",
        marketing ? "accepted" : "declined",
      );
      setSavedMessage("Your privacy choices have been saved.");
    } catch (error) {
      console.error("Privacy choices could not be saved", error);
      setSaveError("Your privacy choices could not be saved. Please try again.");
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

  return (
    <section className="privacy-choice-controls" aria-labelledby="privacy-choice-heading">
      <h2 id="privacy-choice-heading">Manage optional services</h2>
      <p>
        Essential storage is always on. Analytics and marketing services are optional and can be
        changed independently.
      </p>
      {loadError ? (
        <div role="alert">
          <p className="form-error">Your current choices could not be loaded.</p>
          <button className="button button-outline" type="button" onClick={() => void retryLoad()}>
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="privacy-choice-categories">
            <ConsentCategoryRow
              id="privacy-essential"
              title="Essential"
              description="Stores core site preferences and your privacy choice. Always on."
              checked
              disabled
            />
            <ConsentCategoryRow
              id="privacy-analytics"
              title="Analytics"
              description="Google Analytics measurement and Cortality session replay on eligible public pages."
              checked={analyticsEnabled}
              disabled={!ready || saving}
              onChange={setAnalyticsEnabled}
            />
            <ConsentCategoryRow
              id="privacy-marketing"
              title="Marketing"
              description="Meta Pixel PageView measurement on eligible public pages."
              checked={marketingEnabled}
              disabled={!ready || saving}
              onChange={setMarketingEnabled}
            />
          </div>
          <div className="privacy-choice-actions">
            <button
              className="button button-outline"
              type="button"
              disabled={!ready || saving}
              onClick={() => void saveChoices(false, false)}
            >
              Reject all
            </button>
            <button
              className="button button-outline"
              type="button"
              disabled={!ready || saving}
              onClick={() => void saveChoices(analyticsEnabled, marketingEnabled)}
            >
              Save preferences
            </button>
            <button
              className="button button-dark"
              type="button"
              disabled={!ready || saving}
              onClick={() => void saveChoices(true, true)}
            >
              Accept all
            </button>
          </div>
          {!ready ? <p role="status">Loading your current choices…</p> : null}
          {saving ? <p role="status">Saving your choices…</p> : null}
          {savedMessage ? <p className="form-success" role="status">{savedMessage}</p> : null}
          {saveError ? <p className="form-error" role="alert">{saveError}</p> : null}
        </>
      )}
    </section>
  );
}
