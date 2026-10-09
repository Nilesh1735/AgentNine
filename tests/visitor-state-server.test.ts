import { describe, expect, it } from "vitest";
import { NextResponse } from "next/server";
import { attachVisitorCookie, getVisitorId, VISITOR_COOKIE_NAME } from "@/lib/visitor-state-server";

const visitorId = "b7c2d723-0aa2-4c30-89ba-8fcb78b6522a";

describe("visitor cookie migration", () => {
  it("reads existing visitor identity from the prior cookie name", () => {
    const request = new Request("https://agentnine.pro", {
      headers: { cookie: `agenthive_visitor=${visitorId}` },
    });

    expect(getVisitorId(request)).toBe(visitorId);
  });

  it("prefers the AgentNine cookie when both names are present", () => {
    const otherVisitorId = "a3d022e5-3434-4672-9e35-826460436c84";
    const request = new Request("https://agentnine.pro", {
      headers: { cookie: `agenthive_visitor=${otherVisitorId}; ${VISITOR_COOKIE_NAME}=${visitorId}` },
    });

    expect(getVisitorId(request)).toBe(visitorId);
  });

  it("sets the AgentNine cookie and expires the prior cookie", () => {
    const response = NextResponse.json({ ok: true });
    attachVisitorCookie(response, visitorId);

    expect(response.cookies.get(VISITOR_COOKIE_NAME)?.value).toBe(visitorId);
    expect(response.cookies.get("agenthive_visitor")?.maxAge).toBe(0);
  });
});
