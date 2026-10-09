import { describe, expect, it } from "vitest";
import { getAgentArtworkVariant } from "@/lib/agent-artwork";

describe("agent artwork categories", () => {
  it("uses one fixed motif for all agents in each catalog category", () => {
    expect(getAgentArtworkVariant("coding", "first-agent")).toBe(3);
    expect(getAgentArtworkVariant("coding", "second-agent")).toBe(3);
    expect(getAgentArtworkVariant("research", "first-agent")).toBe(0);
    expect(getAgentArtworkVariant("automation", "first-agent")).toBe(1);
    expect(getAgentArtworkVariant("content", "first-agent")).toBe(2);
  });

  it("uses a stable motif for other categories, with agent fallback when category is missing", () => {
    expect(getAgentArtworkVariant("new-category", "first-agent"))
      .toBe(getAgentArtworkVariant("new-category", "second-agent"));
    expect(getAgentArtworkVariant(undefined, "first-agent"))
      .toBe(getAgentArtworkVariant(undefined, "first-agent"));
  });
});
