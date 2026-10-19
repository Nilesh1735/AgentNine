"use client";

import { useEffect, useMemo, useState } from "react";
import type { SiteFeedbackStatus } from "@/lib/site-feedback";

type FeedbackRow = {
  id: string;
  display_name: string | null;
  message: string;
  publication_consent: boolean;
  status: SiteFeedbackStatus;
  created_at: string;
  published_at: string | null;
};

type StatusFilter = "all" | SiteFeedbackStatus;

const filters: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Not published" },
];

function csrf() {
  return document.cookie.split("; ").find((part) => part.startsWith("admin_csrf="))?.split("=")[1] ?? "";
}

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(date);
}

export function SiteFeedbackModeration() {
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/site-feedback", { cache: "no-store", signal: AbortSignal.timeout(15_000) });
      const result = await response.json().catch(() => null) as { feedback?: FeedbackRow[]; error?: string } | null;
      if (!response.ok || !result || !Array.isArray(result.feedback)) {
        setError(result?.error ?? "Feedback review could not be loaded. Try again.");
        return;
      }
      setFeedback(result.feedback);
    } catch (requestError) {
      console.error("Admin feedback request failed:", requestError);
      setError("The feedback review service could not be reached. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function updateStatus(row: FeedbackRow, status: SiteFeedbackStatus) {
    setSavingId(row.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/site-feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf() },
        body: JSON.stringify({ id: row.id, status }),
        signal: AbortSignal.timeout(15_000),
      });
      const result = await response.json().catch(() => null) as { feedback?: FeedbackRow; error?: string } | null;
      if (!response.ok || !result?.feedback) {
        setError(result?.error ?? "Feedback could not be updated. Try again.");
        return;
      }
      const updatedFeedback = result.feedback;
      setFeedback((current) => current.map((item) => item.id === row.id ? updatedFeedback : item));
      setMessage(status === "published" ? "Feedback approved and published." : status === "rejected" ? "Feedback removed from public view." : "Feedback returned to the pending queue.");
    } catch (requestError) {
      console.error("Admin feedback update failed:", requestError);
      setError("The moderation service could not be reached. Check your connection and try again.");
    } finally {
      setSavingId("");
    }
  }

  const visibleFeedback = useMemo(
    () => feedback.filter((item) => filter === "all" || item.status === filter),
    [feedback, filter],
  );

  return (
    <section className="admin-feedback" aria-label="Community feedback moderation">
      <nav className="admin-feedback-filters" aria-label="Filter feedback submissions">
        {filters.map((item) => (
          <button
            className={`button button-light${filter === item.value ? " is-active" : ""}`}
            type="button"
            key={item.value}
            aria-pressed={filter === item.value}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
        <button className="button button-light" type="button" onClick={() => void load()} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </nav>
      {error ? <p className="form-error" role="alert">{error} <button className="text-link retry-inline" type="button" onClick={() => void load()}>Try again</button></p> : null}
      {message ? <p className="form-success" role="status" aria-live="polite">{message}</p> : null}
      {loading ? <p className="community-feedback-state" role="status">Loading feedback submissions...</p> : null}
      {!loading && !error && visibleFeedback.length === 0 ? (
        <p className="community-feedback-state">
          {filter === "pending" ? "No feedback is waiting for review." : "No feedback in this view."}
        </p>
      ) : null}
      {!loading && visibleFeedback.length > 0 ? (
        <div className="admin-feedback-list">
          {visibleFeedback.map((row) => (
            <article className="admin-feedback-item" key={row.id}>
              <div className="admin-feedback-meta">
                <span>{row.display_name || "No display name"}</span>
                <time dateTime={row.created_at}>{dateLabel(row.created_at)}</time>
                <span className={`admin-feedback-status is-${row.status}`}>
                  {row.status === "rejected" ? "Not published" : row.status}
                </span>
              </div>
              <p className="admin-feedback-message">{row.message}</p>
              <p className="admin-feedback-permission">
                {row.publication_consent
                  ? "The submitter permitted public display."
                  : "The submitter did not permit public display. This item cannot be published."}
              </p>
              <div className="admin-feedback-actions">
                {row.status === "pending" && row.publication_consent ? (
                  <button className="button button-dark" type="button" disabled={savingId === row.id} onClick={() => void updateStatus(row, "published")}>
                    {savingId === row.id ? "Saving..." : "Approve and publish"}
                  </button>
                ) : null}
                {row.status === "pending" ? (
                  <button className="button button-light" type="button" disabled={savingId === row.id} onClick={() => void updateStatus(row, "rejected")}>
                    Do not publish
                  </button>
                ) : null}
                {row.status === "published" ? (
                  <button className="button button-light" type="button" disabled={savingId === row.id} onClick={() => void updateStatus(row, "rejected")}>
                    Remove from homepage
                  </button>
                ) : null}
                {row.status === "rejected" ? (
                  <button className="button button-light" type="button" disabled={savingId === row.id} onClick={() => void updateStatus(row, "pending")}>
                    Return to pending
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
