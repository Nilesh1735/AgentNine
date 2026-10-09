"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { loadVisitorPreferences } from "@/lib/visitor-preferences";
import type { HelpfulnessSummary } from "@/lib/types";

export function AgentFeedback({ slug }: { slug: string }) {
  const [summary, setSummary] = useState<HelpfulnessSummary | null>(null);
  const [choice, setChoice] = useState<boolean | null>(null);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [summaryError, setSummaryError] = useState(false);

  useEffect(() => {
    void fetch(`/api/feedback?slug=${encodeURIComponent(slug)}`)
      .then((response) => {
        if (!response.ok) { setSummaryError(true); return null; }
        return response.json() as Promise<HelpfulnessSummary>;
      })
      .then((value) => { if (value) setSummary(value); })
      .catch(() => setSummaryError(true));
  }, [slug]);

  async function submit(helpful: boolean) {
    setChoice(helpful);
    setState("saving");
    try {
      await loadVisitorPreferences();
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, helpful }),
      });
      if (!response.ok) {
        trackEvent("api_error", { endpoint: "feedback", status: response.status });
        setState(response.status === 409 ? "saved" : "error");
        return;
      }
      const next = await response.json() as HelpfulnessSummary;
      setSummary(next);
      setState("saved");
      trackEvent("feedback_submitted", { helpful });
    } catch {
      trackEvent("api_error", { endpoint: "feedback", status: 503 });
      setState("error");
    }
  }

  return (
    <section className="content-section feedback-section" aria-labelledby="feedback-heading">
      <h2 id="feedback-heading">Was this guide helpful?</h2>
      <div className="feedback-actions">
        <button type="button" className={`button button-outline${choice === true ? " feedback-selected" : ""}`} disabled={state === "saving"} onClick={() => submit(true)}>Yes</button>
        <button type="button" className={`button button-outline${choice === false ? " feedback-selected" : ""}`} disabled={state === "saving"} onClick={() => submit(false)}>Not yet</button>
      </div>
      <p className="muted" aria-live="polite">
        {state === "error" ? "Feedback could not be saved right now." : state === "saved" ? "Thanks for the feedback." : summaryError ? "Feedback totals are currently unavailable." : "Your response is anonymous and limited to one vote per browser."}
        {summary?.total ? ` ${summary.helpful} of ${summary.total} readers found it helpful.` : ""}
      </p>
    </section>
  );
}
