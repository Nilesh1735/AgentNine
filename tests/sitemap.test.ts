import { describe, expect, it } from "vitest";
import { getSitemapLastModified } from "../lib/sitemap";

describe("sitemap last-modified dates", () => {
  it("uses the catalog row's update timestamp", () => {
    expect(getSitemapLastModified("2026-10-12T12:30:00.000Z")).toEqual(
      new Date("2026-10-12T12:30:00.000Z"),
    );
  });

  it("omits last-modified when no catalog update timestamp is available", () => {
    expect(getSitemapLastModified(null)).toBeUndefined();
    expect(getSitemapLastModified(undefined)).toBeUndefined();
    expect(getSitemapLastModified("Not verified")).toBeUndefined();
  });
});
