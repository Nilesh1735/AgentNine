import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { getSupabaseAdminServer } from "@/lib/supabase";
import { GET as getPublicFeedback, POST as submitFeedback } from "@/app/api/site-feedback/route";
import { PATCH as moderateFeedback } from "@/app/api/admin/site-feedback/route";

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
}));

describe("site feedback routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isAdminRequest).mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns only published, consented feedback from the public endpoint", async () => {
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn().mockResolvedValue({
        data: [{ id: "public-1", display_name: null, message: "The setup notes were useful.", published_at: "2026-10-19T00:00:00Z" }],
        error: null,
      }),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.order.mockReturnValue(query);
    vi.mocked(getSupabaseAdminServer).mockReturnValue({ from: vi.fn(() => query) } as never);

    const response = await getPublicFeedback(new Request("https://agentnine.pro/api/site-feedback"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      feedback: [{ id: "public-1", message: "The setup notes were useful." }],
    });
    expect(query.eq).toHaveBeenNthCalledWith(1, "status", "published");
    expect(query.eq).toHaveBeenNthCalledWith(2, "publication_consent", true);
  });

  it("stores public feedback as pending with only the submitted fields", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(getSupabaseAdminServer).mockReturnValue({ from: vi.fn(() => ({ insert })) } as never);
    const request = new Request("https://agentnine.pro/api/site-feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        displayName: "A contributor",
        message: "The source and setup details are helpful.",
        publicationConsent: true,
        website: "",
      }),
    });

    const response = await submitFeedback(request);

    expect(response.status).toBe(201);
    expect(insert).toHaveBeenCalledWith({
      display_name: "A contributor",
      message: "The source and setup details are helpful.",
      publication_consent: true,
      status: "pending",
    });
  });

  it("refuses to publish a submission without explicit permission", async () => {
    const update = vi.fn();
    const existingQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: "b32c94ee-2d81-47de-92bb-9bfb29fa61bb", publication_consent: false }, error: null }),
    };
    existingQuery.select.mockReturnValue(existingQuery);
    existingQuery.eq.mockReturnValue(existingQuery);
    const client = {
      from: vi.fn(() => existingQuery),
      update,
    };
    vi.mocked(getSupabaseAdminServer).mockReturnValue(client as never);
    const request = new NextRequest("https://agentnine.pro/api/admin/site-feedback", {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-csrf-token": "valid" },
      body: JSON.stringify({ id: "b32c94ee-2d81-47de-92bb-9bfb29fa61bb", status: "published" }),
    });

    const response = await moderateFeedback(request);

    expect(response.status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });

  it("protects moderation data behind the admin session", async () => {
    vi.mocked(isAdminRequest).mockResolvedValue(false);
    const from = vi.fn();
    vi.mocked(getSupabaseAdminServer).mockReturnValue({ from } as never);
    const request = new NextRequest("https://agentnine.pro/api/admin/site-feedback", { method: "PATCH" });

    const response = await moderateFeedback(request);

    expect(response.status).toBe(403);
    expect(from).not.toHaveBeenCalled();
  });
});
