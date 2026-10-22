import { describe, expect, it } from "vitest";
import { metadata as aboutMetadata } from "@/app/about/page";
import { metadata as methodologyMetadata } from "@/app/methodology/page";
import { metadata as joinMetadata } from "@/app/join/page";
import { metadata as faqMetadata } from "@/app/faq/page";
import { metadata as contactMetadata } from "@/app/contact/layout";
import { metadata as privacyMetadata } from "@/app/privacy/page";
import { metadata as cookiesMetadata } from "@/app/cookies/page";
import { metadata as termsMetadata } from "@/app/terms/page";
import { metadata as feedbackMetadata } from "@/app/feedback/page";
import { metadata as privacyChoicesMetadata } from "@/app/privacy/choices/page";
import { metadata as loginMetadata } from "@/app/login/page";
import { metadata as signupMetadata } from "@/app/signup/page";
import { metadata as profileMetadata } from "@/app/profile/page";
import { metadata as accountMetadata } from "@/app/account/page";

describe("static pages excluded from search indexing", () => {
  it.each([
    ["/about", aboutMetadata],
    ["/methodology", methodologyMetadata],
    ["/join", joinMetadata],
    ["/faq", faqMetadata],
    ["/contact", contactMetadata],
    ["/privacy", privacyMetadata],
    ["/cookies", cookiesMetadata],
    ["/terms", termsMetadata],
  ])("keeps %s crawlable but noindex", (_path, metadata) => {
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates?.canonical).toBeTruthy();
  });

  it.each([
    ["/feedback", feedbackMetadata],
    ["/privacy/choices", privacyChoicesMetadata],
    ["/login", loginMetadata],
    ["/signup", signupMetadata],
    ["/profile", profileMetadata],
    ["/account", accountMetadata],
  ])("keeps %s crawlable while excluding it from search", (_path, metadata) => {
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });
});
