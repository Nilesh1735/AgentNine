import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST as contactPost } from "@/app/api/contact/route";
import { POST as reportPost } from "@/app/api/report/route";
import { POST as analyticsPost } from "@/app/api/analytics/route";
import { PATCH as preferencesPatch } from "@/app/api/preferences/route";
import { normalizeAnalyticsPagePath } from "@/lib/analytics-validation";

function request(body: unknown, headers?: Record<string, string>) {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

async function json(response: Response) {
  return { status: response.status, body: await response.json() };
}

describe("public API route validation", () => {
  beforeEach(() => {
    delete process.env.CONTACT_LAMBDA_URL;
    delete process.env.RESEND_API_KEY;
    delete process.env.CONTACT_FROM_EMAIL;
    delete process.env.NEXT_PUBLIC_CONTACT_EMAIL;
    delete process.env.REPORT_LAMBDA_URL;
    delete process.env.TRUSTED_PROXY_HEADERS;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("rejects malformed contact payloads before attempting delivery", async () => {
    const result = await json(await contactPost(request({ name: "A", email: "nope", message: "short" })));

    expect(result.status).toBe(400);
    expect(result.body.code).toBe("invalid_request");
  });

  it("accepts contact honeypot submissions without leaking configuration", async () => {
    const result = await json(await contactPost(request({ website: "https://bot.invalid" })));

    expect(result).toEqual({ status: 200, body: { ok: true } });
  });

  it("returns a controlled response when contact delivery is not configured", async () => {
    const result = await json(
      await contactPost(request({ name: "Ada Lovelace", email: "ada@example.com", message: "This is a valid message." })),
    );

    expect(result.status).toBe(503);
    expect(result.body.code).toBe("not_configured");
  });

  it("sends contact submissions through Resend when configured", async () => {
    process.env.TRUSTED_PROXY_HEADERS = "true";
    vi.stubEnv("NODE_ENV", "development");
    process.env.RESEND_API_KEY = "test-resend-key";
    process.env.NEXT_PUBLIC_CONTACT_EMAIL = "info@agentnine.pro";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "email-id" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await json(await contactPost(request({
      name: "Ada Lovelace",
      email: "ada@example.com",
      requestType: "correction",
      sourceUrl: "https://github.com/example/project",
      message: "The recorded setup command needs updating.",
    }, { "x-forwarded-for": "192.0.2.27" })));

    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith("https://api.resend.com/emails", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ Authorization: "Bearer test-resend-key" }),
      body: expect.stringContaining('"to":["info@agentnine.pro"]'),
    }));
    expect(fetchMock.mock.calls[0]?.[1]?.body).toContain('"from":"onboarding@resend.dev"');
    expect(fetchMock.mock.calls[0]?.[1]?.body).toContain('"reply_to":"ada@example.com"');
    expect(fetchMock.mock.calls[0]?.[1]?.body).toContain("The recorded setup command needs updating.");
  });

  it("rejects join applications with profile URLs outside the approved services", async () => {
    const result = await json(await contactPost(request({
      requestType: "join-request",
      name: "Nilesh Applicant",
      email: "applicant@example.com",
      message: "I would like to help improve the directory.",
      linkedinUrl: "https://example.com/profile",
    })));

    expect(result.status).toBe(400);
    expect(result.body.code).toBe("invalid_profile_url");
  });

  it("rejects oversized contact requests before parsing", async () => {
    const result = await json(
      await contactPost(new Request("http://localhost/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json", "content-length": "9000" },
        body: JSON.stringify({ name: "Ada Lovelace", email: "ada@example.com", message: "This is a valid message." }),
      })),
    );

    expect(result.status).toBe(413);
    expect(result.body.code).toBe("request_too_large");
  });

  it("rejects unknown anonymous preference fields", async () => {
    const result = await json(await preferencesPatch(new Request("http://localhost/api/preferences", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accountEmail: "person@example.com" }),
    })));

    expect(result).toEqual({ status: 400, body: { error: "Invalid preferences" } });
  });

  it("rejects cross-origin preference writes", async () => {
    const result = await json(await preferencesPatch(new Request("http://localhost/api/preferences", {
      method: "PATCH",
      headers: { "content-type": "application/json", origin: "https://attacker.invalid" },
      body: JSON.stringify({ theme: "dark" }),
    })));

    expect(result).toEqual({ status: 403, body: { error: "Cross-origin request rejected" } });
  });

  it("accepts same-origin preference requests when Next is bound to all interfaces", async () => {
    const result = await json(await preferencesPatch(new Request("http://0.0.0.0:3000/api/preferences", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        host: "192.168.1.14:3000",
        origin: "http://192.168.1.14:3000",
      },
      body: JSON.stringify({}),
    })));

    expect(result).toEqual({ status: 400, body: { error: "Invalid preferences" } });
  });

  it("rejects invalid report slugs before contacting the upstream service", async () => {
    const result = await json(await reportPost(request({ slug: "../admin" })));

    expect(result.status).toBe(400);
    expect(result.body.code).toBe("invalid_request");
  });

  it("returns a controlled response when reporting is not configured", async () => {
    const result = await json(await reportPost(request({ slug: "valid-agent" })));

    expect(result.status).toBe(503);
    expect(result.body.code).toBe("not_configured");
  });

  it("requires a database-backed visitor consent before recording analytics", async () => {
    const result = await json(await analyticsPost(request({
      consent: "accepted",
      eventName: "search_zero_results",
      sessionId: "123e4567-e89b-12d3-a456-426614174000",
      pagePath: "/search",
      properties: { filterCount: 2 },
    })));

    expect(result).toEqual({
      status: 403,
      body: { error: "Analytics consent is required.", code: "consent_required" },
    });
  });

  it("rejects analytics events when the client has not accepted analytics consent", async () => {
    const result = await json(await analyticsPost(request({
      eventName: "search_zero_results",
      sessionId: "123e4567-e89b-12d3-a456-426614174000",
      pagePath: "/search",
      properties: { filterCount: 2 },
    })));

    expect(result).toEqual({
      status: 403,
      body: { error: "Analytics consent is required.", code: "consent_required" },
    });
  });

  it("accepts batched analytics events as one request", async () => {
    const result = await json(await analyticsPost(request({
      consent: "accepted",
      events: [
        { eventName: "search", properties: { queryLength: 4, filterCount: 1 } },
        { eventName: "search_success", properties: { resultCount: 3 } },
      ],
      sessionId: "123e4567-e89b-12d3-a456-426614174000",
      pagePath: "/search",
    })));

    expect(result.status).toBe(403);
    expect(result.body.code).toBe("consent_required");
  });

  it("strips query strings from analytics page paths", async () => {
    const result = await json(await analyticsPost(request({
      consent: "accepted",
      eventName: "search",
      sessionId: "123e4567-e89b-12d3-a456-426614174000",
      pagePath: "/search?query=private+terms",
      properties: { queryLength: 12 },
    })));

    expect(result.status).toBe(403);
    expect(result.body.code).toBe("consent_required");
    expect(normalizeAnalyticsPagePath("/search?query=private+terms#results")).toBe("/search");
  });

  it("rejects a batched analytics event with unapproved fields", async () => {
    const result = await json(await analyticsPost(request({
      consent: "accepted",
      events: [
        { eventName: "search", properties: { queryLength: 4, filterCount: 1 } },
        { eventName: "search_success", properties: { query: "private text" } },
      ],
      sessionId: "123e4567-e89b-12d3-a456-426614174000",
      pagePath: "/search",
    })));

    expect(result.status).toBe(400);
  });

  it("rejects unapproved analytics fields", async () => {
    const result = await json(await analyticsPost(request({
      consent: "accepted",
      eventName: "search_success",
      sessionId: "123e4567-e89b-12d3-a456-426614174000",
      pagePath: "/search",
      properties: { query: "private text" },
    })));

    expect(result.status).toBe(400);
  });
});
