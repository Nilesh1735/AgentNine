import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  isAdminRequest: vi.fn(),
  getSupabaseAdminServer: vi.fn(),
  invalidateCatalogAgents: vi.fn(),
}));

vi.mock("@/lib/admin", () => ({ isAdminRequest: mocks.isAdminRequest }));
vi.mock("@/lib/supabase", () => ({ getSupabaseAdminServer: mocks.getSupabaseAdminServer }));
vi.mock("@/lib/catalog-cache", () => ({ invalidateCatalogAgents: mocks.invalidateCatalogAgents }));

import { PATCH } from "@/app/api/admin/agents/route";

const agentId = "123e4567-e89b-42d3-a456-426614174000";

describe("admin agent status updates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isAdminRequest.mockResolvedValue(true);
  });

  it("publishes an agent with nullable os_commands without sending unchanged fields", async () => {
    const previous = {
      id: agentId,
      name: "Example agent",
      slug: "example-agent",
      short_description: "An example",
      category_id: null,
      tags: [],
      github_url: "https://github.com/example/agent",
      version_tag: "v1",
      os_commands: null,
      setup_steps: [],
      status: "needs_review",
      is_archived: false,
      revision: 4,
    };
    const from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: previous, error: null }),
        })),
      })),
    }));
    const resultAgent = { ...previous, status: "published", revision: 5 };
    const rpc = vi.fn().mockResolvedValue({
      data: { status: "ok", agent: resultAgent },
      error: null,
    });
    mocks.getSupabaseAdminServer.mockReturnValue({ from, rpc });

    const response = await PATCH(new NextRequest("http://localhost/api/admin/agents", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": "valid-csrf-token",
      },
      body: JSON.stringify({ id: agentId, revision: 4, status: "published" }),
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: agentId, status: "published" });
    expect(rpc).toHaveBeenCalledWith("admin_update_agent", {
      p_agent_id: agentId,
      p_expected_revision: 4,
      p_agent: { status: "published", is_archived: false },
      p_changed_by: "admin",
    });
    expect(mocks.invalidateCatalogAgents).toHaveBeenCalledOnce();
  });
});
