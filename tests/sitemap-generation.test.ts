import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAgents: vi.fn(),
  getCategories: vi.fn(),
  getPublishedNewsPosts: vi.fn(),
  getLatestPublishedSiteFeedbackUpdate: vi.fn(),
}));

vi.mock("@/lib/data", () => ({
  getAgents: mocks.getAgents,
  getCategories: mocks.getCategories,
}));

vi.mock("@/lib/news", () => ({
  getPublishedNewsPosts: mocks.getPublishedNewsPosts,
}));

vi.mock("@/lib/site-feedback-data", () => ({
  getLatestPublishedSiteFeedbackUpdate: mocks.getLatestPublishedSiteFeedbackUpdate,
}));

import sitemap from "@/app/sitemap";

describe("sitemap generation", () => {
  beforeEach(() => {
    mocks.getAgents.mockResolvedValue({
      status: "ready",
      data: [
        { id: "agent-1", slug: "first-agent", category_id: "category-1", updated_at: "2026-10-12T12:30:00.000Z" },
        { id: "agent-2", slug: "second-agent", category_id: "category-1", updated_at: "2026-10-19T08:00:00.000Z" },
        { id: "agent-3", slug: "third-agent", category_id: "category-2", updated_at: "invalid" },
      ],
    });
    mocks.getCategories.mockResolvedValue({
      status: "ready",
      data: [
        { id: "category-1", slug: "first-category" },
        { id: "category-2", slug: "second-category" },
      ],
    });
    mocks.getPublishedNewsPosts.mockResolvedValue([
      { slug: "first-story", updated_at: "2026-10-18T08:00:00.000Z", published_at: "2026-10-17T08:00:00.000Z", created_at: "2026-10-16T08:00:00.000Z" },
      { slug: "second-story", updated_at: null, published_at: "2026-10-19T08:00:00.000Z", created_at: "2026-10-18T08:00:00.000Z" },
    ]);
    mocks.getLatestPublishedSiteFeedbackUpdate.mockResolvedValue(new Date("2026-10-19T09:00:00.000Z"));
  });

  it("sets the requested feedback priority", async () => {
    const entries = await sitemap();
    expect(entries.find((entry) => entry.url.endsWith("/feedback"))).toMatchObject({
      changeFrequency: "monthly",
      priority: 0.7,
      lastModified: new Date("2026-10-19T00:00:00.000Z"),
    });
  });

  it("uses the newest underlying content date for collection pages", async () => {
    const entries = await sitemap();
    const lastAgentUpdate = new Date("2026-10-19T08:00:00.000Z");
    expect(entries.find((entry) => entry.url.endsWith("/agents"))?.lastModified).toEqual(lastAgentUpdate);
    expect(entries.find((entry) => entry.url.endsWith("/categories/first-category"))?.lastModified).toEqual(lastAgentUpdate);
    expect(entries.find((entry) => entry.url.endsWith("/categories/second-category"))?.lastModified).toBeUndefined();
    expect(entries.find((entry) => entry.url.endsWith("/news"))?.lastModified).toEqual(lastAgentUpdate);
    expect(entries.find((entry) => entry.url === "https://agentnine.pro")?.lastModified).toEqual(new Date("2026-10-19T09:00:00.000Z"));
    expect(entries.find((entry) => entry.url.endsWith("/agents/second-agent"))?.lastModified).toEqual(lastAgentUpdate);
    expect(entries.find((entry) => entry.url.endsWith("/news/second-story"))?.lastModified).toEqual(lastAgentUpdate);
  });

  it("includes last-modified dates for legal pages from the legal revision date", async () => {
    const entries = await sitemap();
    const expected = new Date("October 19, 2026");
    for (const path of ["/privacy", "/cookies", "/terms"]) {
      expect(entries.find((entry) => entry.url.endsWith(path))?.lastModified).toEqual(expected);
    }
  });

  it("includes the last content edit date for the remaining static pages", async () => {
    const entries = await sitemap();
    const expectedDates = {
      "/about": "2026-10-19",
      "/faq": "2026-10-17",
      "/join": "2026-10-09",
      "/contact": "2026-10-12",
      "/methodology": "2026-10-17",
    };
    for (const [path, date] of Object.entries(expectedDates)) {
      expect(entries.find((entry) => entry.url.endsWith(path))?.lastModified).toEqual(new Date(date));
    }
  });
});
