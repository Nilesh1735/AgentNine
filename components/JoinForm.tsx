"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { getContactAuthorizationHeader } from "@/lib/contact-auth";

export function JoinForm() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setStatus("");

    const formElement = event.currentTarget ?? formRef.current;
    if (!formElement) {
      setError("We could not reach the application service. Please try again shortly.");
      return;
    }

    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...await getContactAuthorizationHeader() },
        body: JSON.stringify({
          requestType: "join-request",
          name: form.get("name"),
          email: form.get("email"),
          message: form.get("message"),
          linkedinUrl: form.get("linkedinUrl"),
          githubUrl: form.get("githubUrl"),
          role: form.get("role"),
          website: form.get("website"),
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setError(result?.error || "Your application could not be sent. Please try again.");
        return;
      }
      setStatus(result?.stored
        ? "Your application was saved for review. Thanks for wanting to help build AgentNine."
        : "Your application was sent to AgentNine. Thanks for wanting to help build it.");
      formElement.reset();
    } catch (requestError) {
      console.error("Join application submission failed:", requestError);
      setError("We could not reach the application service. Please try again shortly.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} className="contact-form join-form" onSubmit={submit}>
      <label>
        Your name
        <input required name="name" autoComplete="name" maxLength={120} />
      </label>
      <label>
        Email address
        <input required type="email" name="email" autoComplete="email" maxLength={254} />
        <span className="join-field-help">We use this address to review and respond to your application.</span>
      </label>
      <div className="join-form-row">
        <label>
          LinkedIn profile <span className="form-optional">(optional)</span>
          <input name="linkedinUrl" type="url" autoComplete="url" placeholder="https://www.linkedin.com/in/..." maxLength={300} />
        </label>
        <label>
          GitHub profile <span className="form-optional">(optional)</span>
          <input name="githubUrl" type="url" autoComplete="url" placeholder="https://github.com/..." maxLength={300} />
        </label>
      </div>
      <label>
        What would you like to contribute?
        <input name="role" maxLength={160} placeholder="For example, research, documentation, design, or development" />
      </label>
      <label>
        Why are you interested in joining?
        <textarea required name="message" rows={6} minLength={10} maxLength={3000} />
      </label>
      <label className="contact-honeypot" aria-hidden="true">
        Website
        <input tabIndex={-1} name="website" autoComplete="off" />
      </label>
      <p className="form-notice">
        Your details are used to review and respond to this application. Read our <Link className="text-link" href="/privacy">Privacy policy</Link>.
      </p>
      <button className="button button-dark" type="submit" disabled={pending}>
        {pending ? "Sending..." : "Send application"}
      </button>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {status ? <p className="form-success" role="status" aria-live="polite">{status}</p> : null}
    </form>
  );
}
