import { describe, expect, it } from "vitest";
import {
  canLoadCortality,
  canLoadCortalityAtLocation,
  canUseCortalityForRequest,
  hasCortalityConsent,
  isCortalityPublicPath,
} from "@/lib/cortality";
import { OPTIONAL_CONSENT_VERSION } from "@/lib/optional-consent";
import { getContentSecurityPolicy } from "@/lib/content-security-policy";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";

describe("Cortality consent", () => {
  it("uses the current Analytics category consent", () => {
    expect(hasCortalityConsent({ analyticsConsent: "accepted" })).toBe(false);

    const accepted = {
      analyticsConsent: "accepted" as const,
      analyticsConsentVersion: OPTIONAL_CONSENT_VERSION,
    };
    const declined = {
      analyticsConsent: "declined" as const,
      analyticsConsentVersion: OPTIONAL_CONSENT_VERSION,
    };

    expect(hasCortalityConsent(accepted)).toBe(true);
    expect(hasCortalityConsent(declined)).toBe(false);
  });
});

describe("Cortality public-page allowlist", () => {
  it("allows only named public content routes", () => {
    for (const path of [
      "/", "/agents", "/agents/aider", "/categories", "/categories/coding",
      "/faq", "/about", "/methodology", "/news", "/news/launch-update",
      "/terms", "/privacy", "/cookies",
    ]) {
      expect(isCortalityPublicPath(path), path).toBe(true);
    }
  });

  it("excludes private, authentication, and unknown routes", () => {
    for (const path of [
      "/admin", "/admin/agents", "/account", "/account/delete", "/profile",
      "/news/editor", "/login", "/signup", "/forgot-password", "/auth/callback",
      "/privacy/choices", "/unknown",
    ]) {
      expect(isCortalityPublicPath(path), path).toBe(false);
    }
  });

  it("allows query strings on requested routes and excludes fragments", () => {
    expect(canLoadCortality("/agents/aider", "", "")).toBe(true);
    expect(canLoadCortality("/agents/aider", "?tab=setup", "")).toBe(false);
    for (const path of ["/search", "/compare", "/contact", "/join"]) {
      expect(canLoadCortality(path, "?q=sample", "")).toBe(true);
    }
    expect(canLoadCortality("/agents/aider", "", "#setup")).toBe(false);
    expect(canLoadCortality("/search", "?q=sample", "#results")).toBe(false);
  });

  it("restricts capture to AgentNine's allowed production hostnames", () => {
    expect(canLoadCortalityAtLocation("/about", "", "", "https://agentnine.pro")).toBe(true);
    expect(canLoadCortalityAtLocation("/about", "", "", "https://www.agentnine.pro")).toBe(true);
    expect(canLoadCortalityAtLocation("/about", "", "", "https://preview.agentnine.pro")).toBe(false);
    expect(canUseCortalityForRequest("/about", "", "http://agentnine.pro")).toBe(false);
  });
});

describe("Cortality content security policy", () => {
  it("allows its script and endpoint only in the public policy", () => {
    const publicPolicy = getContentSecurityPolicy(true);
    const excludedPolicy = getContentSecurityPolicy(false);
    expect(publicPolicy).toContain("https://cdn.cortality.com");
    expect(publicPolicy).toContain("https://ingest.cortality.com");
    expect(excludedPolicy).not.toContain("cortality.com");
  });

  it("keeps Cortality blocked on excluded routes and allows the requested pages", () => {
    const publicResponse = proxy(new NextRequest("https://agentnine.pro/about"));
    const adminResponse = proxy(new NextRequest("https://agentnine.pro/admin"));
    const searchResponse = proxy(new NextRequest("https://agentnine.pro/search?q=sample"));
    const compareResponse = proxy(new NextRequest("https://agentnine.pro/compare?agents=aider"));
    const contactResponse = proxy(new NextRequest("https://agentnine.pro/contact"));
    const joinResponse = proxy(new NextRequest("https://agentnine.pro/join"));
    const queryResponse = proxy(new NextRequest("https://agentnine.pro/agents/aider?x=1"));

    expect(publicResponse.headers.has("Content-Security-Policy")).toBe(false);
    for (const response of [adminResponse, queryResponse]) {
      const policy = response.headers.get("Content-Security-Policy") ?? "";
      expect(policy).not.toContain("cortality.com");
    }
    for (const response of [searchResponse, compareResponse, contactResponse, joinResponse]) {
      expect(response.headers.has("Content-Security-Policy")).toBe(false);
    }
  });
});
