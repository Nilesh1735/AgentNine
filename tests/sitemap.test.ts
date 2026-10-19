import { describe, expect, it } from "vitest";
import { getLatestSitemapLastModified, getSitemapLastModified } from "../lib/sitemap";

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

  it("selects the newest valid timestamp and ignores invalid values", () => {
    expect(getLatestSitemapLastModified([
      "2026-10-12T12:30:00.000Z",
      null,
      "invalid",
      "2026-10-19T08:00:00.000Z",
      "2026-10-10T08:00:00.000Z",
    ])).toEqual(new Date("2026-10-19T08:00:00.000Z"));
  });

  it("omits last-modified when the collection has no valid timestamps", () => {
    expect(getLatestSitemapLastModified([])).toBeUndefined();
    expect(getLatestSitemapLastModified([null, undefined, "invalid"])).toBeUndefined();
  });
});
