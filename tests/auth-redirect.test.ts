import { describe, expect, it } from "vitest";
import { getSafeAuthRedirectPath } from "@/lib/auth-redirect";
import { GET as authCallbackGet } from "@/app/auth/callback/route";

describe("getSafeAuthRedirectPath", () => {
  it("preserves a local path and its query string", () => {
    expect(getSafeAuthRedirectPath("/account?tab=saved", "/login")).toBe("/account?tab=saved");
  });

  it.each([
    "https://attacker.invalid",
    "//attacker.invalid/path",
    "/\\attacker.invalid",
    "/path\r\nlocation: https://attacker.invalid",
    null,
  ])("uses the fallback for an unsafe redirect: %s", (value) => {
    expect(getSafeAuthRedirectPath(value, "/login")).toBe("/login");
  });

  it("returns to the originating auth page when the callback has no code", async () => {
    const response = await authCallbackGet(
      new Request("http://localhost:3000/auth/callback?errorPath=%2Fsignup"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/signup?authError=oauth");
  });

  it("does not use an external callback error destination", async () => {
    const response = await authCallbackGet(
      new Request("http://localhost:3000/auth/callback?errorPath=https%3A%2F%2Fattacker.invalid"),
    );

    expect(response.headers.get("location")).toBe("http://localhost:3000/login?authError=oauth");
  });
});
