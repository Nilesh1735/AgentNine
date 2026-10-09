"use client";

import { useEffect, useState } from "react";

type OperationsView = "audit" | "login-history" | "staleness" | "broken-links" | "analytics";
type AuditRow = { id: string; agent_name: string; agent_slug: string | null; changed_by: string; change_reason: string; changed_at: string; fields: string[] };
type LoginRow = { id: string; success: boolean; attempted_at: string };
type StaleRow = { id: string; name: string; slug: string; github_url: string; metadata_last_checked_at: string | null; metadata_is_stale: boolean };
type BrokenLinkRow = { id: string; agent_slug: string; status: "pending" | "in_review"; created_at: string; forwarded_at: string | null; forwarding_error: string | null };
type AnalyticsRow = { day: string; event_name: string; event_count: number };
type OperationRow = AuditRow | LoginRow | StaleRow | BrokenLinkRow | AnalyticsRow;

const tabs: Array<{ view: OperationsView; label: string }> = [
  { view: "audit", label: "Audit history" },
  { view: "login-history", label: "Login history" },
  { view: "staleness", label: "Staleness worklist" },
  { view: "broken-links", label: "Broken-link queue" },
  { view: "analytics", label: "Analytics" },
];

function formatDate(value: string | null) {
  if (!value) return "Never checked";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString();
}

function csrf() {
  return document.cookie.split("; ").find((part) => part.startsWith("admin_csrf="))?.split("=")[1] ?? "";
}

export function AdminOperations() {
  const [activeView, setActiveView] = useState<OperationsView>("audit");
  const [rows, setRows] = useState<OperationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadRows(view: OperationsView) {
    try {
      const response = await fetch(`/api/admin/operations?view=${view}`, { cache: "no-store" });
      const result = await response.json() as { rows?: OperationRow[]; error?: string };
      if (!response.ok) {
        setError(result.error ?? "This admin view could not be loaded.");
        return;
      }
      setRows(result.rows ?? []);
    } catch (requestError) {
      console.error(`Admin ${view} view could not be loaded:`, requestError);
      setError("The dashboard service could not be reached. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function load(view: OperationsView) {
    setActiveView(view);
    setLoading(true);
    setError("");
    setMessage("");
    void loadRows(view);
  }

  async function setReportStatus(id: string, status: "in_review" | "resolved" | "ignored") {
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/operations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf() },
        body: JSON.stringify({ id, status }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "The report could not be updated.");
        return;
      }
      setMessage(status === "in_review" ? "Report moved to in review." : `Report marked ${status}.`);
      await load("broken-links");
    } catch (requestError) {
      console.error("Broken-link report status update failed:", requestError);
      setError("The report could not be updated. Try again.");
    }
  }

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/operations?view=audit", { cache: "no-store" })
      .then(async (response) => ({
        response,
        result: await response.json() as { rows?: OperationRow[]; error?: string },
      }))
      .then(({ response, result }) => {
        if (cancelled) return;
        if (!response.ok) {
          setError(result.error ?? "This admin view could not be loaded.");
          return;
        }
        setRows(result.rows ?? []);
      })
      .catch((requestError: unknown) => {
        if (cancelled) return;
        console.error("Admin audit view could not be loaded:", requestError);
        setError("The dashboard service could not be reached. Try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="admin-operations" aria-labelledby="admin-operations-title">
      <div className="admin-operations-heading">
        <div>
          <h2 id="admin-operations-title">Operations</h2>
          <p className="muted">Review catalog changes, access attempts, stale records, reports, and consented analytics.</p>
        </div>
        <button className="button button-light" type="button" onClick={() => void load(activeView)} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh view"}
        </button>
      </div>
      <div className="admin-operation-tabs" role="group" aria-label="Admin operations">
        {tabs.map(({ view, label }) => (
          <button
            key={view}
            className="button button-light"
            type="button"
            aria-pressed={activeView === view}
            onClick={() => void load(view)}
          >
            {label}
          </button>
        ))}
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {message ? <p className="muted" role="status">{message}</p> : null}
      {loading ? <p className="muted" role="status">Loading {tabs.find((tab) => tab.view === activeView)?.label.toLowerCase()}...</p> : null}
      {!loading && !error && rows.length === 0 ? <p className="admin-operation-empty">No records in this view.</p> : null}

      {!loading && activeView === "audit" && rows.length > 0 ? (
        <ol className="admin-operation-list">
          {(rows as AuditRow[]).map((row) => (
            <li key={row.id}>
              <div className="admin-operation-row-heading">
                {row.agent_slug ? <a href={`/agents/${row.agent_slug}`}>{row.agent_name}</a> : <strong>{row.agent_name}</strong>}
                <time dateTime={row.changed_at}>{formatDate(row.changed_at)}</time>
              </div>
              <p>{row.change_reason} by {row.changed_by}</p>
              <small>{row.fields.length ? `Changed fields: ${row.fields.join(", ")}` : "No field-level difference recorded"}</small>
            </li>
          ))}
        </ol>
      ) : null}

      {!loading && activeView === "login-history" && rows.length > 0 ? (
        <ol className="admin-operation-list">
          {(rows as LoginRow[]).map((row) => (
            <li key={row.id}>
              <div className="admin-operation-row-heading">
                <strong>{row.success ? "Successful sign-in" : "Rejected sign-in"}</strong>
                <time dateTime={row.attempted_at}>{formatDate(row.attempted_at)}</time>
              </div>
              <p>IP addresses are intentionally omitted from this view.</p>
            </li>
          ))}
        </ol>
      ) : null}

      {!loading && activeView === "staleness" && rows.length > 0 ? (
        <ol className="admin-operation-list">
          {(rows as StaleRow[]).map((row) => (
            <li key={row.id}>
              <div className="admin-operation-row-heading">
                <a href={`/agents/${row.slug}`}>{row.name}</a>
                <time dateTime={row.metadata_last_checked_at ?? undefined}>{formatDate(row.metadata_last_checked_at)}</time>
              </div>
              <p>{row.metadata_is_stale ? "Marked stale" : "Metadata has not been checked"} · <a href={row.github_url} target="_blank" rel="noreferrer">Upstream repository</a></p>
            </li>
          ))}
        </ol>
      ) : null}

      {!loading && activeView === "broken-links" && rows.length > 0 ? (
        <ol className="admin-operation-list">
          {(rows as BrokenLinkRow[]).map((row) => (
            <li key={row.id}>
              <div className="admin-operation-row-heading">
                <a href={`/agents/${row.agent_slug}`}>{row.agent_slug}</a>
                <time dateTime={row.created_at}>{formatDate(row.created_at)}</time>
              </div>
              <p>Status: {row.status}. {row.forwarded_at ? "Forwarded to the configured report service." : row.forwarding_error ?? "Waiting for external forwarding."}</p>
              <div className="admin-operation-actions">
                {row.status === "pending" ? <button className="text-link" type="button" onClick={() => void setReportStatus(row.id, "in_review")}>Mark in review</button> : null}
                <button className="text-link" type="button" onClick={() => void setReportStatus(row.id, "resolved")}>Resolve</button>
                <button className="text-link" type="button" onClick={() => void setReportStatus(row.id, "ignored")}>Ignore</button>
              </div>
            </li>
          ))}
        </ol>
      ) : null}

      {!loading && activeView === "analytics" && rows.length > 0 ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Date</th><th>Event</th><th>Count</th></tr></thead>
            <tbody>{(rows as AnalyticsRow[]).map((row) => <tr key={`${row.day}-${row.event_name}`}><td>{row.day}</td><td>{row.event_name}</td><td>{row.event_count.toLocaleString()}</td></tr>)}</tbody>
          </table>
        </div>
      ) : null}
      <p className="admin-operations-footnote">Each history list shows at most 50 or 100 recent rows. Analytics groups the last 30 days by day and event name and does not expose event properties or search text.</p>
    </section>
  );
}
