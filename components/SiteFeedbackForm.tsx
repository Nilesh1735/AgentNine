"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

type SubmitState = "idle" | "sending" | "sent" | "error";

export function SiteFeedbackForm() {
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState("");
  const [publicationConsent, setPublicationConsent] = useState(false);
  const [submittedWithConsent, setSubmittedWithConsent] = useState(false);

  function clearStatus() {
    if (state === "error" || state === "sent") {
      setState("idle");
      setError("");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending") return;
    const formElement = event.currentTarget;
    const willPublish = publicationConsent;
    setState("sending");
    setError("");

    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/site-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: form.get("displayName"),
          message: form.get("message"),
          publicationConsent: willPublish,
          website: form.get("website"),
        }),
        signal: AbortSignal.timeout(15_000),
      });
      const result = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) {
        setError(result?.error ?? "Feedback could not be saved. Try again shortly.");
        setState("error");
        return;
      }
      formElement.reset();
      setSubmittedWithConsent(willPublish);
      setPublicationConsent(false);
      setState("sent");
    } catch (requestError) {
      console.error("Site feedback request failed:", requestError);
      setError("We could not reach the feedback service. Check your connection and try again.");
      setState("error");
    }
  }

  return (
    <form className="contact-form site-feedback-form" onSubmit={submit}>
      <label>
        Display name
        <input name="displayName" autoComplete="name" maxLength={80} onChange={clearStatus} />
      </label>
      <label>
        Your feedback
        <textarea
          name="message"
          rows={6}
          minLength={10}
          maxLength={1200}
          placeholder="What helped, what felt unclear, or what should we improve?"
          required
          onChange={clearStatus}
        />
      </label>
      <label className="contact-honeypot" aria-hidden="true">
        Website
        <input tabIndex={-1} name="website" autoComplete="off" />
      </label>
      <label className="privacy-acknowledgement site-feedback-consent">
        <input
          type="checkbox"
          checked={publicationConsent}
          onChange={(event) => {
            clearStatus();
            setPublicationConsent(event.target.checked);
          }}
        />
        <span>
          I give AgentNine permission to display this feedback on the homepage if it is approved.
          Leave this unchecked for feedback that should stay private.
        </span>
      </label>
      <p className="form-notice">
        Feedback is reviewed before it can appear publicly. Please do not include passwords,
        account details, or other private information. See the{" "}
        <Link className="text-link" href="/privacy">Privacy policy</Link>.
      </p>
      <button className="button button-dark" type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Sending feedback..." : "Send feedback"}
      </button>
      {state === "error" ? <p className="form-error" role="alert">{error}</p> : null}
      {state === "sent" ? (
        <p className="form-success" role="status" aria-live="polite">
          {submittedWithConsent
            ? "Thanks. Your feedback is saved for review and will appear only if approved."
            : "Thanks. Your feedback was saved privately for the AgentNine team."}
        </p>
      ) : null}
    </form>
  );
}
