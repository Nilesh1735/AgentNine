import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { isRestrictedCountry } from "../lib/region-access";
import { proxy } from "../proxy";

describe("restricted country access", () => {
  it.each([
    "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI",
    "FR", "GR", "HR", "HU", "IE", "IS", "IT", "LI", "LT", "LU",
    "LV", "MT", "NL", "NO", "PL", "PT", "RO", "SE", "SI", "SK",
    "GB", "CH", "AX", "GF", "GP", "MF", "MQ", "RE", "YT",
  ])("blocks %s", (countryCode) => {
    expect(isRestrictedCountry(countryCode)).toBe(true);
  });

  it.each(["US", "CA", "IN", "JP", "AU", ""])("allows %s", (countryCode) => {
    expect(isRestrictedCountry(countryCode)).toBe(false);
  });

  it("treats country codes case-insensitively", () => {
    expect(isRestrictedCountry("gb")).toBe(true);
  });

  it("allows requests without a country header", () => {
    expect(isRestrictedCountry(null)).toBe(false);
    expect(isRestrictedCountry(undefined)).toBe(false);
  });

  it("returns a noindex 403 page for restricted-country page requests", async () => {
    const response = proxy(new NextRequest("https://agentnine.pro/privacy", {
      headers: { "x-vercel-ip-country": "DE" },
    }));

    expect(response.status).toBe(403);
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(response.headers.get("set-cookie")).toBeNull();
    const body = await response.text();
    expect(body).toContain("not available in your region");
    expect(body).toContain("mailto:info@agentnine.pro");
  });

  it("returns a JSON 403 for restricted-country API requests", async () => {
    const response = proxy(new NextRequest("https://agentnine.pro/api/contact", {
      headers: { "x-vercel-ip-country": "GB" },
    }));

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.json()).toEqual({
      error: "AgentNine is not available in your region.",
      contact: "info@agentnine.pro",
    });
  });

  it("continues requests from countries not restricted", () => {
    const response = proxy(new NextRequest("https://agentnine.pro/", {
      headers: { "x-vercel-ip-country": "IN" },
    }));

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
