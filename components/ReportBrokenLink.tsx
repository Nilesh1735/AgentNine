"use client";

import { useState } from "react";
import { getContactMailto } from "@/lib/config";

export function ReportBrokenLink({ slug }: { slug: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  async function report() {
    setState("sending");
    setErrorMessage("");
    try {
      const response = await fetch("/api/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }) });
      const result = await response.json().catch(() => null) as { error?: string } | null;
      setState(response.ok ? "sent" : "error");
      if (!response.ok) setErrorMessage(result?.error ?? "We could not submit the report. Try again.");
    } catch {
      setState("error");
      setErrorMessage("We could not reach the reporting service. Check your connection and try again.");
    }
  }
  const mailto = getContactMailto(`Broken AgentNine link: ${slug}`, `Please review the source link for agent: ${slug}`);
  return <div className="report-box"><div><strong>Is this link out of date?</strong><p>Report it and we will check the listing.</p>{state === "error" ? <p className="report-error" role="alert">{errorMessage}</p> : null}</div>{state === "sent" ? <span aria-live="polite" className="report-success">Report sent.</span> : <div className="report-actions"><button type="button" className="button button-outline" onClick={report} disabled={state === "sending"}>{state === "sending" ? "Sending…" : state === "error" ? "Try again" : "Report broken link"}</button>{state === "error" && mailto ? <a className="text-link" href={mailto}>Email us instead</a> : null}</div>}</div>;
}
