import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createNewsEditorSession, getNewsEditorSessionFromToken, revokeNewsEditorSession } from "../lib/news-editor-auth";
import { getSupabaseAdminServer } from "@/lib/supabase";

vi.mock("@/lib/supabase", () => ({ getSupabaseAdminServer: vi.fn() }));

/** Stands in for the revocation lookup. `revoked` decides whether a row comes back. */
function mockRevocationStore(
  revoked: boolean,
  error?: { message: string },
  upsertError?: { message: string },
) {
  const upsert = vi.fn().mockResolvedValue({ error: upsertError ?? null });
  vi.mocked(getSupabaseAdminServer).mockReturnValue({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: revoked ? { session_id: "revoked" } : null,
            error: error ?? null,
          }),
        }),
      }),
      upsert,
    }),
  } as unknown as ReturnType<typeof getSupabaseAdminServer>);
  return upsert;
}

function requestWithSession(token: string) {
  return new NextRequest("https://agentnine.pro/api/news/editor/auth", {
    headers: { cookie: `news_editor_session=${token}` },
  });
}

describe("news editor sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRevocationStore(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("signs and verifies a time-limited session with a separate news key", async () => {
    vi.stubEnv("NEWS_EDITOR_KEY", "N".repeat(40));
    const created = createNewsEditorSession();
    await expect(getNewsEditorSessionFromToken(created.session)).resolves.toMatchObject({ csrf: created.csrf });
  });

  it("issues a distinct session id per sign-in so sessions can be revoked individually", async () => {
    vi.stubEnv("NEWS_EDITOR_KEY", "N".repeat(40));
    const first = await getNewsEditorSessionFromToken(createNewsEditorSession().session);
    const second = await getNewsEditorSessionFromToken(createNewsEditorSession().session);
    expect(first?.sessionId).toBeTruthy();
    expect(first?.sessionId).not.toBe(second?.sessionId);
  });

  it("rejects a revoked session even though its signature is still valid", async () => {
    vi.stubEnv("NEWS_EDITOR_KEY", "N".repeat(40));
    const created = createNewsEditorSession();
    await expect(getNewsEditorSessionFromToken(created.session)).resolves.not.toBeNull();
    // Signing out must stop the token working before it expires on its own.
    mockRevocationStore(true);
    await expect(getNewsEditorSessionFromToken(created.session)).resolves.toBeNull();
  });

  it("fails closed when the revocation store cannot be reached", async () => {
    vi.stubEnv("NEWS_EDITOR_KEY", "N".repeat(40));
    const created = createNewsEditorSession();
    mockRevocationStore(false, { message: "connection refused" });
    await expect(getNewsEditorSessionFromToken(created.session)).resolves.toBeNull();
  });

  it("rejects a session when the database is unavailable", async () => {
    vi.stubEnv("NEWS_EDITOR_KEY", "N".repeat(40));
    const created = createNewsEditorSession();
    vi.mocked(getSupabaseAdminServer).mockReturnValue(null);
    await expect(getNewsEditorSessionFromToken(created.session)).resolves.toBeNull();
  });

  it("revokes a valid session in the shared revocation store", async () => {
    vi.stubEnv("NEWS_EDITOR_KEY", "N".repeat(40));
    const created = createNewsEditorSession();
    const session = await getNewsEditorSessionFromToken(created.session);
    if (!session) throw new Error("Expected the newly-created session to be valid.");
    const upsert = mockRevocationStore(false);

    await expect(revokeNewsEditorSession(requestWithSession(created.session))).resolves.toBe(true);
    expect(upsert).toHaveBeenCalledWith(
      { session_id: session.sessionId, expires_at: new Date(session.expires).toISOString() },
      { onConflict: "session_id" },
    );
  });

  it("does not write a revocation for an invalid signed token", async () => {
    vi.stubEnv("NEWS_EDITOR_KEY", "N".repeat(40));
    const created = createNewsEditorSession();
    const upsert = mockRevocationStore(false);
    const [payload, signature] = created.session.split(".");

    await expect(revokeNewsEditorSession(requestWithSession(`${payload}.${signature.slice(1)}`))).resolves.toBe(true);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("reports a revocation write failure", async () => {
    vi.stubEnv("NEWS_EDITOR_KEY", "N".repeat(40));
    const created = createNewsEditorSession();
    const upsert = mockRevocationStore(false, undefined, { message: "write failed" });

    await expect(revokeNewsEditorSession(requestWithSession(created.session))).resolves.toBe(false);
    expect(upsert).toHaveBeenCalledOnce();
  });

  it("reports unavailable database access when revoking", async () => {
    vi.stubEnv("NEWS_EDITOR_KEY", "N".repeat(40));
    const created = createNewsEditorSession();
    vi.mocked(getSupabaseAdminServer).mockReturnValue(null);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(revokeNewsEditorSession(requestWithSession(created.session))).resolves.toBe(false);
    expect(errorSpy).toHaveBeenCalledOnce();
  });

  it("rejects tampered sessions and malformed signatures without throwing", async () => {
    vi.stubEnv("NEWS_EDITOR_KEY", "N".repeat(40));
    const created = createNewsEditorSession();
    const [payload, signature] = created.session.split(".");
    await expect(getNewsEditorSessionFromToken(`${payload}.${signature.slice(1)}`)).resolves.toBeNull();
    await expect(getNewsEditorSessionFromToken(`${payload}.${"é".repeat(signature.length)}`)).resolves.toBeNull();
  });

  it("requires a sufficiently long news editor key", () => {
    vi.stubEnv("NEWS_EDITOR_KEY", "short");
    expect(() => createNewsEditorSession()).toThrow("NEWS_EDITOR_KEY must contain at least 32 characters.");
  });
});
