export type SiteFeedbackStatus = "pending" | "published" | "rejected";

export type SiteFeedbackInput = {
  displayName: string | null;
  message: string;
  publicationConsent: boolean;
};

export type SiteFeedbackValidation =
  | { ok: true; value: SiteFeedbackInput; honeypot: boolean }
  | { ok: false; error: string };

export function validateSiteFeedbackInput(value: unknown): SiteFeedbackValidation {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: "Enter your feedback and try again." };
  }

  const input = value as Record<string, unknown>;
  if (
    (input.displayName !== undefined && input.displayName !== null && typeof input.displayName !== "string")
    || (input.website !== undefined && typeof input.website !== "string")
  ) {
    return { ok: false, error: "Enter valid feedback details and try again." };
  }
  const message = typeof input.message === "string" ? input.message.trim() : "";
  const displayName = typeof input.displayName === "string" ? input.displayName.trim() : "";

  if (typeof input.publicationConsent !== "boolean") {
    return { ok: false, error: "Choose whether your feedback may be shown publicly." };
  }
  if (message.length < 10 || message.length > 1200) {
    return { ok: false, error: "Feedback must be between 10 and 1,200 characters." };
  }
  if (displayName.length > 80) {
    return { ok: false, error: "Display name must be 80 characters or fewer." };
  }

  return {
    ok: true,
    value: {
      displayName: displayName || null,
      message,
      publicationConsent: input.publicationConsent,
    },
    honeypot: typeof input.website === "string" && input.website.trim().length > 0,
  };
}
