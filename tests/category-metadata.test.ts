import { describe, expect, it } from "vitest";
import { getCategoryMetadata } from "@/lib/category-metadata";

describe("getCategoryMetadata", () => {
  it.each([
    ["Automation agents", "automation agents"],
    ["Coding agents", "coding agents"],
    ["Content agents", "content agents"],
    ["Research agents", "research agents"],
  ])("normalizes the %s category without repeating agents", (name, subject) => {
    expect(getCategoryMetadata({ name, description: `${name} description.` })).toEqual({
      title: `Open-source ${subject}: setup guides`,
      description: `Explore ${subject} by source, setup requirements, and documented access. ${name} description.`,
    });
  });

  it("keeps agent in category labels singular or already included in a longer name", () => {
    expect(getCategoryMetadata({ name: "AI research agents", description: "Research." }).title)
      .toBe("Open-source AI research agents: setup guides");
    expect(getCategoryMetadata({ name: "Research agent", description: "Research." }).title)
      .toBe("Open-source research agents: setup guides");
  });

  it("uses the generic fallback when category data is unavailable", () => {
    expect(getCategoryMetadata(undefined)).toEqual({
      title: "Open-source AI agent category",
      description: "Explore open-source AI agents by category, with source repositories, setup guidance, and documented system access.",
    });
  });
});
