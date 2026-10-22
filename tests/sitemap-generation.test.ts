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

  it("does not include the noindex feedback form", async () => {
    const entries = await sitemap();
    expect(entries.find((entry) => entry.url.endsWith("/feedback"))).toBeUndefined();
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

  it("excludes pages marked noindex from the sitemap", async () => {
    const entries = await sitemap();
    for (const path of [
      "/about",
      "/methodology",
      "/join",
      "/faq",
      "/contact",
      "/privacy",
      "/cookies",
      "/terms",
    ]) {
      expect(entries.find((entry) => entry.url === `https://agentnine.pro${path}`)).toBeUndefined();
    }
  });

  it("keeps published agents, categories, and news articles in the sitemap", async () => {
    const entries = await sitemap();
    for (const path of [
      "/agents/first-agent",
      "/categories/first-category",
      "/news/first-story",
    ]) {
      expect(entries.find((entry) => entry.url === `https://agentnine.pro${path}`)).toBeDefined();
    }
  });
});
