"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ConsentCategoryRow } from "@/components/ConsentCategoryRow";
import { saveOptionalConsentChoices } from "@/lib/analytics-consent";
import {
  hasCurrentOptionalConsentChoices,
  hasOptionalAnalyticsConsent,
  hasOptionalMarketingConsent,
} from "@/lib/optional-consent";
import { useVisitorPreferences } from "@/lib/visitor-preferences";

export function ConsentBanner() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [customizing, setCustomizing] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);
  const { preferences, ready } = useVisitorPreferences();
  const pathname = usePathname();
  const dialogRef = useRef<HTMLElement>(null);
  const customizeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!customizing) return;

    const previousActiveElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("[data-dialog-initial-focus]")?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setCustomizing(false);
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const controls = [...dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), a[href]',
      )];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      const returnFocus = customizeButtonRef.current?.isConnected
        ? customizeButtonRef.current
        : previousActiveElement?.isConnected
          ? previousActiveElement
          : document.querySelector<HTMLElement>('[aria-label="AgentNine home"]');
      if (!returnFocus) return;
      returnFocus.focus({ preventScroll: true });
    };
  }, [customizing]);

  async function saveChoices(analytics: boolean, marketing: boolean) {
    setSaving(true);
    setError("");
    try {
      await saveOptionalConsentChoices(
        analytics ? "accepted" : "declined",
        marketing ? "accepted" : "declined",
      );
      window.requestAnimationFrame(() => {
        document.querySelector<HTMLElement>('[aria-label="AgentNine home"]')
          ?.focus({ preventScroll: true });
      });
      setCustomizing(false);
    } catch (saveError) {
      console.error("Privacy preferences could not be saved", saveError);
      setError("Your privacy choices could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function openCustomizer() {
    setAnalyticsEnabled(hasOptionalAnalyticsConsent(preferences));
    setMarketingEnabled(hasOptionalMarketingConsent(preferences));
    setError("");
    setCustomizing(true);
  }

  const visible = pathname !== "/privacy/choices"
    && ready
    && !hasCurrentOptionalConsentChoices(preferences);
  if (!visible || !ready) return null;

  return (
    <>
      <aside className="consent-banner" aria-label="Privacy choices">
        <div className="consent-banner-copy">
          <strong>Privacy choices</strong>
          <p>
            Choose whether optional analytics and marketing services may run. Read the{" "}
            <Link href="/privacy">Privacy policy</Link> or change your choices on the{" "}
            <Link href="/privacy/choices">Privacy choices page</Link>.
          </p>
        </div>
        <div className="consent-actions">
          <button
            type="button"
            className="button button-outline"
            disabled={saving}
            onClick={() => void saveChoices(false, false)}
          >
            Reject all
          </button>
          <button
            ref={customizeButtonRef}
            type="button"
            className="button button-outline consent-customize-button"
            disabled={saving}
            onClick={openCustomizer}
          >
            Customize
          </button>
          <button
            type="button"
            className="button button-dark"
            disabled={saving}
            onClick={() => void saveChoices(true, true)}
          >
            Accept all
          </button>
        </div>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
      </aside>

      {customizing ? (
        <div
          className="consent-dialog-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCustomizing(false);
          }}
        >
          <section
            ref={dialogRef}
            className="consent-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="consent-dialog-title"
            aria-describedby="consent-dialog-description"
          >
            <header className="consent-dialog-header">
              <div>
                <h2 id="consent-dialog-title">Privacy preferences</h2>
                <p id="consent-dialog-description">
                  Choose which optional services AgentNine may use. Essential storage is always on.
                  {" "}See the{" "}
                  <Link href="/privacy" onClick={() => setCustomizing(false)}>
                    Privacy policy
                  </Link>{" "}
                  for details.
                </p>
              </div>
              <button
                type="button"
                className="consent-dialog-close"
                aria-label="Close privacy preferences without saving"
                data-dialog-initial-focus
                onClick={() => setCustomizing(false)}
              >
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
                  <path d="m5 5 10 10M15 5 5 15" />
                </svg>
              </button>
            </header>

            <div className="consent-category-list">
              <ConsentCategoryRow
                id="consent-essential"
                title="Essential"
                description="Stores core site preferences and your privacy choice. Always on."
                checked
                disabled
              />
              <ConsentCategoryRow
                id="consent-analytics"
                title="Analytics"
                description="Google Analytics measurement and Cortality session replay on eligible public pages."
                checked={analyticsEnabled}
                disabled={saving}
                onChange={setAnalyticsEnabled}
              />
              <ConsentCategoryRow
                id="consent-marketing"
                title="Marketing"
                description="Meta Pixel PageView measurement on eligible public pages."
                checked={marketingEnabled}
                disabled={saving}
                onChange={setMarketingEnabled}
              />
            </div>

            <footer className="consent-dialog-footer">
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              <div className="consent-dialog-actions">
                <button
                  type="button"
                  className="button button-outline"
                  disabled={saving}
                  onClick={() => void saveChoices(false, false)}
                >
                  Reject all
                </button>
                <button
                  type="button"
                  className="button button-dark"
                  disabled={saving}
                  onClick={() => void saveChoices(analyticsEnabled, marketingEnabled)}
                >
                  {saving ? "Saving…" : "Save preferences"}
                </button>
              </div>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
