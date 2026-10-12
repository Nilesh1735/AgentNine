import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { getSupabaseAdminServer, getSupabasePublicServer } from "../lib/supabase";
import { PATCH as retryAdminOperation } from "../app/api/admin/operations/route";
import { POST as deleteAccount } from "../app/api/account/delete/route";
import { POST as submitContact } from "../app/api/contact/route";

vi.mock("@/lib/admin", () => ({
  isAdminRequest: vi.fn(async () => true),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRequestRateLimit: vi.fn(async () => ({
    status: "allowed",
    limit: 5,
    remaining: 4,
    resetAfterSeconds: 60,
  })),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseAdminServer: vi.fn(),
  getSupabasePublicServer: vi.fn(),
}));

describe("server route partial failures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CONTACT_LAMBDA_URL", "");
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("CONTACT_FROM_EMAIL", "");
    vi.stubEnv("NEXT_PUBLIC_CONTACT_EMAIL", "info@example.com");
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("reports a saved contact submission when email forwarding fails", async () => {
    const submissionId = "d85c7ef7-7526-4aaf-b683-44718d546ec8";
    const rpc = vi.fn(async (name: string) => name === "create_contribution_submission_with_delivery"
      ? { data: submissionId, error: null }
      : {
          data: [{
            submission_id: submissionId,
            request_type: "other",
            name: "Test User",
            email: "person@example.com",
            source_url: null,
            message: "Please review this contribution.",
            attempt_count: 1,
          }],
          error: null,
        });
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    const adminClient = { from: vi.fn(() => ({ update })), rpc };
    vi.stubEnv("CONTACT_LAMBDA_URL", "https://contact.example/submit");
    vi.mocked(getSupabaseAdminServer).mockReturnValue(adminClient as never);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 503 })));

    const request = new Request("https://agentnine.pro/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "person@example.com",
        message: "Please review this contribution.",
        requestType: "other",
        privacyAcknowledged: true,
      }),
    });

    const response = await submitContact(request);

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      code: "upstream_failure",
      stored: true,
      queued: true,
    });
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: "failed" }));
  });

  it("keeps a saved contact submission queued when delivery is not configured", async () => {
    const submissionId = "d85c7ef7-7526-4aaf-b683-44718d546ec8";
    const rpc = vi.fn().mockResolvedValue({ data: submissionId, error: null });
    const adminClient = { rpc };
    vi.mocked(getSupabaseAdminServer).mockReturnValue(adminClient as never);

    const request = new Request("https://agentnine.pro/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "person@example.com",
        message: "Please review this contribution.",
        requestType: "other",
        privacyAcknowledged: true,
      }),
    });

    const response = await submitContact(request);

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toMatchObject({
      stored: true,
      queued: true,
      deliveryStatus: "pending",
    });
    expect(rpc).toHaveBeenCalledOnce();
  });

  it("lets the admin retry a queued contact notification", async () => {
    const submissionId = "d85c7ef7-7526-4aaf-b683-44718d546ec8";
    const rpc = vi.fn().mockResolvedValue({
      data: [{
        submission_id: submissionId,
        request_type: "other",
        name: "Test User",
        email: "person@example.com",
        source_url: null,
        message: "Please review this contribution.",
        attempt_count: 2,
      }],
      error: null,
    });
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    vi.stubEnv("CONTACT_LAMBDA_URL", "https://contact.example/submit");
    vi.mocked(getSupabaseAdminServer).mockReturnValue({
      rpc,
      from: vi.fn(() => ({ update })),
    } as never);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 200 })));

    const response = await retryAdminOperation(new NextRequest("https://agentnine.pro/api/admin/operations", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "retry-contact-delivery", submissionId }),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true, deliveryStatus: "delivered" });
    expect(rpc).toHaveBeenCalledWith("claim_contact_delivery", { p_submission_id: submissionId });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: "delivered" }));
  });

  it("reports that account records may already be removed if auth deletion fails", async () => {
    const adminClient = {
      rpc: vi.fn().mockResolvedValue({ error: null }),
      auth: {
        admin: {
          deleteUser: vi.fn().mockResolvedValue({ error: { message: "Auth service unavailable" } }),
        },
      },
    };
    const publicClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "72e2de2d-682f-4e7e-bc12-f59caf2374c6", email: "person@example.com" } },
          error: null,
        }),
      },
    };
    vi.mocked(getSupabaseAdminServer).mockReturnValue(adminClient as never);
    vi.mocked(getSupabasePublicServer).mockReturnValue(publicClient as never);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await deleteAccount(new Request("https://agentnine.pro/api/account/delete", {
      method: "POST",
      headers: {
        authorization: "Bearer valid-session-token",
        "content-type": "application/json",
      },
    }));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      code: "account_deletion_incomplete",
      error: expect.stringContaining("contribution records may already have been removed"),
    });
  });
});
