import { existsSync } from "node:fs";
import { join } from "node:path";
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
import { metadata as forgotPasswordMetadata } from "@/app/forgot-password/page";
import { metadata as resetPasswordMetadata } from "@/app/reset-password/page";
import { metadata as profileMetadata } from "@/app/profile/page";
import { metadata as accountMetadata } from "@/app/account/page";

describe("public page indexing policy", () => {
  it.each([
    ["/about", aboutMetadata],
    ["/join", joinMetadata],
    ["/contact", contactMetadata],
    ["/feedback", feedbackMetadata],
  ])("allows %s to be indexed", (_path, metadata) => {
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
    expect(metadata.alternates?.canonical).toBeTruthy();
  });

  it.each([
    ["/methodology", methodologyMetadata],
    ["/faq", faqMetadata],
    ["/privacy", privacyMetadata],
    ["/cookies", cookiesMetadata],
    ["/terms", termsMetadata],
    ["/privacy/choices", privacyChoicesMetadata],
  ])("inherits the indexable site default for %s", (_path, metadata) => {
    expect(metadata.robots).toBeUndefined();
    expect(metadata.alternates?.canonical).toBeTruthy();
  });

  it.each([
    ["/login", loginMetadata],
    ["/signup", signupMetadata],
    ["/profile", profileMetadata],
    ["/account", accountMetadata],
  ])("keeps %s crawlable while excluding it from search", (_path, metadata) => {
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });

  it("gives each auth route unique metadata and a matching Open Graph URL", () => {
    const authPages = [
      ["/login", loginMetadata],
      ["/signup", signupMetadata],
      ["/forgot-password", forgotPasswordMetadata],
      ["/reset-password", resetPasswordMetadata],
    ] as const;
    const descriptions = authPages.map(([, metadata]) => metadata.description);

    expect(new Set(descriptions).size).toBe(authPages.length);
    for (const [path, metadata] of authPages) {
      const url = `https://agentnine.pro${path}`;
      expect(metadata.alternates?.canonical).toBe(url);
      expect(metadata.openGraph).toMatchObject({ url });
      expect(metadata.description).toBeTruthy();
    }
  });

  it("does not put public pages behind route-level loading skeletons", () => {
    const publicLoadingBoundaries = [
      "app/loading.tsx",
      "app/about/loading.tsx",
      "app/agents/[slug]/loading.tsx",
      "app/categories/loading.tsx",
      "app/categories/[slug]/loading.tsx",
      "app/compare/loading.tsx",
      "app/contact/loading.tsx",
      "app/cookies/loading.tsx",
      "app/faq/loading.tsx",
      "app/join/loading.tsx",
      "app/methodology/loading.tsx",
      "app/privacy/loading.tsx",
      "app/search/loading.tsx",
      "app/terms/loading.tsx",
    ];

    for (const route of publicLoadingBoundaries) {
      expect(existsSync(join(process.cwd(), route)), route).toBe(false);
    }
  });

});
