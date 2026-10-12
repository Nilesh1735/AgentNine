import { describe, expect, it } from "vitest";
import { hasAuthorizedUseDescription, isSecurityTestingTool } from "../lib/security-testing";

describe("security-testing tool classification", () => {
  it.each([
    ["authorized security testing"],
    ["penetration-testing"],
    ["red_team"],
    ["offensive security tools"],
    ["Pentest"],
  ])("recognizes the %s tag", (tag) => {
    expect(isSecurityTestingTool([tag])).toBe(true);
  });

  it("does not classify a generic security tag as a security-testing tool", () => {
    expect(isSecurityTestingTool(["security"])).toBe(false);
  });

  it.each([
    {
      name: "Decepticon",
      tags: ["authorized security testing"],
      description: "AI-orchestrated red-team and penetration-testing tool for authorized engagements.",
    },
    {
      name: "Future penetration-testing listing",
      tags: ["penetration-testing"],
      description: "A tool for authorized security testing on owned systems.",
    },
  ])("accepts authorized-use wording for tagged listing $name", ({ tags, description }) => {
    expect(hasAuthorizedUseDescription(tags, description)).toBe(true);
  });

  it("rejects security-testing listings without authorized-use wording", () => {
    expect(hasAuthorizedUseDescription(
      ["authorized security testing"],
      "Autonomous penetration-testing CLI coordinating AI agents and offensive tools.",
    )).toBe(false);
  });

  it("does not require authorization wording for other tools", () => {
    expect(hasAuthorizedUseDescription(["coding"], "A coding assistant.")).toBe(true);
  });
});
