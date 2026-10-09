import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { isTrustedOrigin } from "@/lib/admin";

describe("isTrustedOrigin", () => {
  it("allows requests without an Origin header", () => {
    const request = new NextRequest("http://0.0.0.0:3000/api/admin/auth", {
      headers: { host: "localhost:3000" },
    });

    expect(isTrustedOrigin(request)).toBe(true);
  });

  it("matches the browser origin to the forwarded request host", () => {
    const request = new NextRequest("http://0.0.0.0:3000/api/admin/auth", {
      headers: {
        host: "localhost:3000",
        origin: "http://localhost:3000",
        "x-forwarded-host": "localhost:3000",
        "x-forwarded-proto": "http",
      },
    });

    expect(isTrustedOrigin(request)).toBe(true);
  });

  it("rejects a different browser origin", () => {
    const request = new NextRequest("http://0.0.0.0:3000/api/admin/auth", {
      headers: {
        host: "localhost:3000",
        origin: "https://attacker.example",
        "x-forwarded-host": "localhost:3000",
        "x-forwarded-proto": "http",
      },
    });

    expect(isTrustedOrigin(request)).toBe(false);
  });

  it("uses HTTPS forwarded by the production proxy", () => {
    const request = new NextRequest("http://internal:3000/api/admin/auth", {
      headers: {
        host: "agentnine.pro",
        origin: "https://agentnine.pro",
        "x-forwarded-proto": "https",
      },
    });

    expect(isTrustedOrigin(request)).toBe(true);
  });
});
