import { describe, expect, it } from "vitest";

import { getAuthErrorMessage } from "@/lib/auth-error-message";

describe("Supabase authentication error messages", () => {
  it("explains signup throttling without blaming a valid email", () => {
    expect(getAuthErrorMessage({ message: "Too many requests", status: 429 }, "signup")).toContain("Too many signup");
  });

  it("explains email confirmation rate limits", () => {
    expect(getAuthErrorMessage({ message: "rate limited", code: "over_email_send_rate_limit" }, "signup")).toContain("confirmation-email");
  });

  it("handles an existing account", () => {
    expect(getAuthErrorMessage({ message: "User already registered", code: "user_already_exists" }, "signup")).toContain("already exists");
  });

  it("handles provider configuration that disables signup", () => {
    expect(getAuthErrorMessage({ message: "Signups not allowed", code: "signup_disabled" }, "signup")).toContain("currently disabled");
  });

  it("does not reveal raw provider errors for unknown failures", () => {
    expect(getAuthErrorMessage({ message: "internal database detail", status: 500 }, "signup")).toBe(
      "We could not create your account. Try again later. If it keeps happening, contact support.",
    );
  });
});
