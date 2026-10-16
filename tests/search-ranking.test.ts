import { describe, expect, it } from "vitest";
import { getDirectSearchScore } from "../lib/search-ranking";

describe("direct search relevance", () => {
  it("ranks a name match ahead of a description-only match", () => {
    const nameScore = getDirectSearchScore("Nova agent", "Nova agent coding tool", "nova");
    const descriptionScore = getDirectSearchScore("Other agent", "A tool named Nova", "nova");

    expect(nameScore).toBe(0);
    expect(descriptionScore).toBe(0.2);
  });

  it("ranks an exact Codex listing above a listing that only mentions Codex", () => {
    const codexScore = getDirectSearchScore("Codex", "Codex coding agent", "codex");
    const openCreatorScore = getDirectSearchScore("OpenCreator", "OpenCreator supports Codex", "codex");

    expect(codexScore).toBe(0);
    expect(openCreatorScore).toBe(0.2);
  });

  it("returns no direct score when the query is absent", () => {
    expect(getDirectSearchScore("Other agent", "A coding tool", "nova")).toBeNull();
  });
});
