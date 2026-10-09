"use client";

import { FormEvent, useRef, useState } from "react";
import { Select } from "@base-ui/react/select";
import { getContactEmail } from "@/lib/config";
import { getContactAuthorizationHeader } from "@/lib/contact-auth";

const requestTypeOptions = [
  { label: "Correct an existing listing", value: "correction" },
  { label: "Suggest an agent to add", value: "agent-suggestion" },
  { label: "Other question", value: "other" },
];

export default function ContactPage() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const [requestType, setRequestType] = useState("correction");
  const contactEmail = getContactEmail();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");
    const formElement = event.currentTarget ?? formRef.current;
    if (!formElement) {
      setError("We could not reach the contact service. Try again shortly.");
      return;
    }
    const form = new FormData(formElement);
    setPending(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...await getContactAuthorizationHeader() },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          message: form.get("message"),
          requestType,
          sourceUrl: form.get("sourceUrl"),
          website: form.get("website"),
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setError(result?.error || "We could not send your message. Try again shortly.");
        return;
      }
      setStatus("Your message was sent. We will reply using the address you provided.");
      formElement.reset();
    } catch (requestError) {
      console.error("Contact submission failed:", requestError);
      setError("We could not reach the contact service. Try again shortly.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main id="main-content" className="page-shell">
      <div className="container prose-page">
        <p className="eyebrow">Contributions</p>
        <h1>Send a correction or suggest an agent.</h1>
        <p className="contact-intro">
          Useful reports include a source link, the version you checked, and what changed. We review submissions before changing a public listing.
        </p>
        <form ref={formRef} className="contact-form" onSubmit={submit}>
          <div className="contact-form-field">
            <Select.Root
              name="requestType"
              value={requestType}
              items={requestTypeOptions}
              highlightItemOnHover={false}
              onValueChange={(value) => {
                if (typeof value === "string") setRequestType(value);
              }}
            >
              <Select.Label className="contact-form-select-label">What would you like to send?</Select.Label>
              <Select.Trigger className="contact-form-select">
                <Select.Value />
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner className="contact-select-positioner" sideOffset={4}>
                  <Select.Popup className="contact-select-popup">
                    <Select.List className="contact-select-list">
                      {requestTypeOptions.map((option) => (
                        <Select.Item className="contact-select-item" key={option.value} value={option.value}>
                          <Select.ItemText>{option.label}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.List>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </div>
          <label>
            Name
            <input required name="name" autoComplete="name" />
          </label>
          <label>
            Email
            <input required type="email" name="email" autoComplete="email" />
          </label>
          <label>
            Repository or listing URL <span className="form-optional">(optional)</span>
            <input name="sourceUrl" type="url" placeholder="https://github.com/owner/project" />
          </label>
          <label className="contact-honeypot" aria-hidden="true">
            Website
            <input tabIndex={-1} name="website" autoComplete="off" />
          </label>
          <label>
            What should we know?
            <textarea
              required
              name="message"
              rows={6}
              minLength={10}
              placeholder={
                requestType === "agent-suggestion"
                  ? "Share the repository, why it belongs in the directory, and any setup evidence."
                  : "Describe the change and link to supporting evidence where possible."
              }
            />
          </label>
          <p className="form-notice">
            We use these details only to respond and review the submission. See the{" "}
            <a className="text-link" href="/privacy">Privacy policy</a>.
          </p>
          <button className="button button-dark" type="submit" disabled={pending}>
            {pending ? "Sending..." : "Send contribution"}
          </button>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          {status ? <p className="form-success" role="status" aria-live="polite">{status}</p> : null}
        </form>
        {contactEmail ? (
          <p className="contact-direct">
            Prefer email? <a className="text-link" href={`mailto:${contactEmail}`}>{contactEmail}</a>
          </p>
        ) : null}
      </div>
    </main>
  );
}
