import { afterEach, describe, expect, it, vi } from "vitest";
import { createNewsEditorSession, getNewsEditorSessionFromToken } from "../lib/news-editor-auth";

describe("news editor sessions", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("signs and verifies a time-limited session with a separate news key", () => {
    vi.stubEnv("NEWS_EDITOR_KEY", "N".repeat(40));
    const created = createNewsEditorSession();
    expect(getNewsEditorSessionFromToken(created.session)).toMatchObject({ csrf: created.csrf });
  });

  it("rejects tampered sessions and malformed signatures without throwing", () => {
    vi.stubEnv("NEWS_EDITOR_KEY", "N".repeat(40));
    const created = createNewsEditorSession();
    const [payload, signature] = created.session.split(".");
    expect(getNewsEditorSessionFromToken(`${payload}.${signature.slice(1)}`)).toBeNull();
    expect(() => getNewsEditorSessionFromToken(`${payload}.${"é".repeat(signature.length)}`)).not.toThrow();
  });

  it("requires a sufficiently long news editor key", () => {
    vi.stubEnv("NEWS_EDITOR_KEY", "short");
    expect(() => createNewsEditorSession()).toThrow("NEWS_EDITOR_KEY must contain at least 32 characters.");
  });
});
