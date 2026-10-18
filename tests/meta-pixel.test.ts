import { describe, expect, it } from "vitest";
import { META_PIXEL_ID, shouldTrackMetaPageView } from "@/lib/meta-pixel";

const origin = "https://agentnine.pro";

describe("Meta Pixel page selection", () => {
  it("uses the requested pixel ID", () => {
    expect(META_PIXEL_ID).toBe("927600866897675");
  });

  it("allows eligible public pages with only campaign parameters", () => {
    expect(shouldTrackMetaPageView(
      "/agents/aider",
      "?utm_source=instagram&utm_medium=social&utm_campaign=launch",
      "",
      origin,
    )).toBe(true);
  });

  it("excludes private, authentication, and search pages", () => {
    for (const pathname of ["/admin", "/account", "/profile", "/login", "/auth/callback", "/privacy/choices", "/search"]) {
      expect(shouldTrackMetaPageView(pathname, "", "", origin)).toBe(false);
    }
  });

  it("does not send URLs or referrers containing non-campaign query parameters", () => {
    expect(shouldTrackMetaPageView("/search", "?q=private+search", "", origin)).toBe(false);
    expect(shouldTrackMetaPageView("/agents/aider", "?utm_source=instagram&q=private", "", origin)).toBe(false);
    expect(shouldTrackMetaPageView(
      "/agents/aider",
      "",
      "https://agentnine.pro/search?q=private+search",
      origin,
    )).toBe(false);
  });

  it("does not send a private same-origin referrer", () => {
    expect(shouldTrackMetaPageView(
      "/agents/aider",
      "",
      "https://agentnine.pro/admin",
      origin,
    )).toBe(false);
  });
});
