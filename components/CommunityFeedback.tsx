"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type PublicFeedback = {
  id: string;
  display_name: string | null;
  message: string;
  published_at: string | null;
};

type LoadState = "loading" | "loaded" | "error";

function publishedDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short" }).format(date);
}

export function CommunityFeedback() {
  const [feedback, setFeedback] = useState<PublicFeedback[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    const controller = new AbortController();
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 10_000);
    void fetch("/api/site-feedback", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (controller.signal.aborted) return;
        const result = await response.json().catch(() => null) as { feedback?: PublicFeedback[]; error?: string } | null;
        if (controller.signal.aborted) return;
        if (!response.ok || !result || !Array.isArray(result.feedback)) {
          console.error("Community feedback could not be loaded:", result?.error ?? response.status);
          setState("error");
          return;
        }
        setFeedback(result.feedback);
        setState("loaded");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted && !timedOut) return;
        console.error("Community feedback request failed:", error);
        setState("error");
      });

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  return (
    <section className="section community-feedback" aria-labelledby="community-feedback-title">
      <div className="container community-feedback-layout">
        <div className="community-feedback-heading">
          <h2 id="community-feedback-title">Feedback from the community.</h2>
          <p>
            Notes from people using AgentNine. Every item shown here was shared with permission
            and approved by the team.
          </p>
          <Link className="button button-dark community-feedback-action" href="/feedback">
            Share feedback
          </Link>
        </div>
        <div className="community-feedback-list" aria-live="polite">
          {state === "loading" ? (
            <p className="community-feedback-state" role="status">Loading community feedback...</p>
          ) : state === "error" ? (
            <p className="community-feedback-state" role="status">
              Community feedback could not be loaded right now. You can still{" "}
              <Link className="text-link" href="/feedback">share your feedback</Link>.
            </p>
          ) : feedback.length === 0 ? (
            <p className="community-feedback-state">
              No public feedback yet. If you have used AgentNine, share what should stay or change.
            </p>
          ) : (
            feedback.map((item) => (
              <article className="community-feedback-item" key={item.id}>
                <p>{item.message}</p>
                <footer>
                  <span>{item.display_name || "Community contributor"}</span>
                  {publishedDate(item.published_at) ? <time dateTime={item.published_at ?? undefined}>{publishedDate(item.published_at)}</time> : null}
                </footer>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
