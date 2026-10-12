import { getContactEmail } from "@/lib/config";

export type ContactDeliveryMessage = {
  requestType: string;
  sourceUrl: string;
  name: string;
  email: string;
  message: string;
};

export type ContactDeliveryResult =
  | { ok: true }
  | { ok: false; code: "not_configured" | "misconfigured" | "rate_limited" | "upstream_failure" | "timeout" | "unavailable"; error: string };

export function isContactDeliveryConfigured() {
  const endpoint = process.env.CONTACT_LAMBDA_URL?.trim();
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.CONTACT_FROM_EMAIL?.trim()
    || (resendApiKey && process.env.NODE_ENV === "development" ? "onboarding@resend.dev" : "");
  const to = getContactEmail();

  return Boolean(endpoint || (resendApiKey && from && to));
}

export async function sendContactDelivery(
  delivery: ContactDeliveryMessage,
): Promise<ContactDeliveryResult> {
  const endpoint = process.env.CONTACT_LAMBDA_URL?.trim();
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.CONTACT_FROM_EMAIL?.trim()
    || (resendApiKey && process.env.NODE_ENV === "development" ? "onboarding@resend.dev" : "");
  const to = getContactEmail();

  if (!endpoint && !resendApiKey && !from) {
    return { ok: false, code: "not_configured", error: "Contact email delivery is not configured." };
  }
  if (!endpoint && (!resendApiKey || !from || !to)) {
    console.error("Contact delivery configuration is incomplete: configure CONTACT_LAMBDA_URL or RESEND_API_KEY, CONTACT_FROM_EMAIL, and NEXT_PUBLIC_CONTACT_EMAIL.");
    return { ok: false, code: "misconfigured", error: "Contact email delivery is not fully configured." };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const upstream = endpoint
      ? await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "contact",
            requestType: delivery.requestType,
            sourceUrl: delivery.sourceUrl,
            name: delivery.name,
            email: delivery.email,
            message: delivery.message,
          }),
          signal: controller.signal,
        })
      : await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: [to],
            reply_to: delivery.email,
            subject: `AgentNine ${delivery.requestType.replaceAll("-", " ")}`,
            text: [
              `Request type: ${delivery.requestType}`,
              `Name: ${delivery.name}`,
              `Email: ${delivery.email}`,
              `Repository or listing URL: ${delivery.sourceUrl || "Not provided"}`,
              "",
              "Message:",
              delivery.message,
            ].join("\n"),
          }),
          signal: controller.signal,
        });

    if (upstream.status === 429) {
      return { ok: false, code: "rate_limited", error: "The contact provider rate limited this delivery." };
    }
    if (!upstream.ok) {
      console.error(`Contact provider rejected a delivery with HTTP ${upstream.status}.`);
      return { ok: false, code: "upstream_failure", error: `The contact provider returned HTTP ${upstream.status}.` };
    }
    return { ok: true };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { ok: false, code: "timeout", error: "The contact provider timed out; delivery may be ambiguous." };
    }
    console.error("Contact delivery request failed:", error);
    return { ok: false, code: "unavailable", error: "The contact provider could not be reached." };
  } finally {
    clearTimeout(timeout);
  }
}
