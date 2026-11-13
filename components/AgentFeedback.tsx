"use client";

import { useEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { loadVisitorPreferences } from "@/lib/visitor-preferences";
import type { HelpfulnessSummary } from "@/lib/types";

export function AgentFeedback({ slug }: { slug: string }) {
  const [summary, setSummary] = useState<HelpfulnessSummary | null>(null);
  const [choice, setChoice] = useState<boolean | null>(null);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [summaryError, setSummaryError] = useState(false);
  const requestVersionRef = useRef(0);

  useEffect(() => {
    const requestVersion = ++requestVersionRef.current;
    setSummary(null);
    setChoice(null);
    setState("idle");
    setSummaryError(false);
    void fetch(`/api/feedback?slug=${encodeURIComponent(slug)}`)
      .then((response) => {
        if (!response.ok) {
          if (requestVersion === requestVersionRef.current) setSummaryError(true);
          return null;
        }
        return response.json() as Promise<HelpfulnessSummary>;
      })
      .then((value) => {
        if (value && requestVersion === requestVersionRef.current) setSummary(value);
      })
      .catch(() => {
        if (requestVersion === requestVersionRef.current) setSummaryError(true);
      });
    return () => {
      if (requestVersion === requestVersionRef.current) requestVersionRef.current += 1;
    };
  }, [slug]);

  async function submit(helpful: boolean) {
    const requestVersion = ++requestVersionRef.current;
    setChoice(helpful);
    setState("saving");
    try {
      await loadVisitorPreferences();
      if (requestVersion !== requestVersionRef.current) return;
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, helpful }),
      });
      if (requestVersion !== requestVersionRef.current) return;
      const next = await response.json() as HelpfulnessSummary;
      if (requestVersion !== requestVersionRef.current) return;
      if (response.status === 409) {
        setChoice(null);
        setSummary(next);
        setState("saved");
        return;
      }
      if (!response.ok) {
        setState("error");
        return;
      }
      setSummary(next);
      setState("saved");
      trackEvent("feedback_submitted", { helpful });
    } catch {
      if (requestVersion === requestVersionRef.current) setState("error");
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
