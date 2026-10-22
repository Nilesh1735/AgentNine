import { describe, expect, it } from "vitest";
import { metadata as searchMetadata } from "@/app/search/page";
import { metadata as compareMetadata } from "@/app/compare/page";

describe("public search and compare metadata", () => {
  it.each([
    ["search", searchMetadata, "https://agentnine.pro/search"],
    ["compare", compareMetadata, "https://agentnine.pro/compare"],
  ])("keeps the %s utility page indexable with a canonical URL", (_name, metadata, canonical) => {
    expect(metadata.robots).toBeUndefined();
    expect(metadata.alternates?.canonical).toBe(canonical);
    expect(metadata.description).toBeTruthy();
  });
});
