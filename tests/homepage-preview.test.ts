import { describe, expect, it } from "vitest";
import { selectHomepagePreviewAgents } from "@/lib/homepage-preview";

describe("selectHomepagePreviewAgents", () => {
  it("selects up to six agents from each category in category order", () => {
    const categories = ["automation", "coding", "content", "research"].map((id) => ({ id }));
    const agents = categories.flatMap(({ id }) =>
      Array.from({ length: 8 }, (_, index) => ({ category_id: id, name: `${id}-${index + 1}` })),
    );

    const selected = selectHomepagePreviewAgents(agents, categories);

    expect(selected).toHaveLength(24);
    expect(categories.map(({ id }) => selected.filter((agent) => agent.category_id === id))).toEqual(
      categories.map(({ id }) => agents.filter((agent) => agent.category_id === id).slice(0, 6)),
    );
    expect(selected.map((agent) => agent.name)).not.toContain("automation-7");
  });

  it("keeps a category below six agents without filling from another category", () => {
    const categories = [{ id: "automation" }, { id: "coding" }];
    const agents = [
      { category_id: "automation", name: "agent-a" },
      { category_id: "coding", name: "agent-b" },
      { category_id: "coding", name: "agent-c" },
    ];

    expect(selectHomepagePreviewAgents(agents, categories)).toEqual(agents);
  });
});
