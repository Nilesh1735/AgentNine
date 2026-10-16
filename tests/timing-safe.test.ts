import { describe, expect, it } from "vitest";
import { timingSafeStringEqual } from "../lib/timing-safe";

describe("timing-safe string comparison", () => {
  it("compares equal strings", () => {
    expect(timingSafeStringEqual("admin-secret", "admin-secret")).toBe(true);
  });

  it("returns false for different UTF-8 byte lengths without throwing", () => {
    expect(() => timingSafeStringEqual("a", "é")).not.toThrow();
    expect(timingSafeStringEqual("a", "é")).toBe(false);
  });
});
