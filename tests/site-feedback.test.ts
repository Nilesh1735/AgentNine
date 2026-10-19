import { describe, expect, it } from "vitest";
import { validateSiteFeedbackInput } from "@/lib/site-feedback";

describe("validateSiteFeedbackInput", () => {
  it("trims feedback and normalizes an empty display name", () => {
    expect(validateSiteFeedbackInput({
      displayName: " ",
      message: "  This directory helped me compare setup requirements.  ",
      publicationConsent: false,
    })).toEqual({
      ok: true,
      value: {
        displayName: null,
        message: "This directory helped me compare setup requirements.",
        publicationConsent: false,
      },
      honeypot: false,
    });
  });

  it("keeps an optional display name and detects a filled honeypot", () => {
    const result = validateSiteFeedbackInput({
      displayName: "Nilesh",
      message: "I would like to see more setup notes.",
      publicationConsent: true,
      website: "https://spam.example",
    });
    expect(result).toMatchObject({
      ok: true,
      value: { displayName: "Nilesh", publicationConsent: true },
      honeypot: true,
    });
  });

  it("rejects missing publication choice", () => {
    expect(validateSiteFeedbackInput({ message: "Useful directory.", displayName: "" })).toEqual({
      ok: false,
      error: "Choose whether your feedback may be shown publicly.",
    });
  });

  it("rejects messages outside the supported length", () => {
    expect(validateSiteFeedbackInput({
      message: "Too short",
      publicationConsent: false,
    })).toMatchObject({ ok: false });
    expect(validateSiteFeedbackInput({
      message: "x".repeat(1201),
      publicationConsent: false,
    })).toMatchObject({ ok: false });
  });

  it("rejects invalid payloads and overlong display names", () => {
    expect(validateSiteFeedbackInput([])).toMatchObject({ ok: false });
    expect(validateSiteFeedbackInput({
      displayName: 42,
      message: "This message has an acceptable length.",
      publicationConsent: false,
    })).toMatchObject({ ok: false });
    expect(validateSiteFeedbackInput({
      displayName: "x".repeat(81),
      message: "This message has an acceptable length.",
      publicationConsent: false,
    })).toMatchObject({ ok: false });
  });
});
