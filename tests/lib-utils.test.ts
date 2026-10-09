import { afterEach, describe, expect, it } from "vitest";

import { getContactEmail, getContactMailto } from "@/lib/config";

describe("contact configuration", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  });

  it("returns null when no contact email is configured", () => {
    delete process.env.NEXT_PUBLIC_CONTACT_EMAIL;

    expect(getContactEmail()).toBeNull();
    expect(getContactMailto("Hello", "Body")).toBeNull();
  });

  it("encodes mailto subjects and bodies", () => {
    process.env.NEXT_PUBLIC_CONTACT_EMAIL = " hello@example.com ";

    expect(getContactMailto("A & B", "Line one\nLine two")).toBe(
      "mailto:hello@example.com?subject=A+%26+B&body=Line+one%0ALine+two",
    );
  });
});
