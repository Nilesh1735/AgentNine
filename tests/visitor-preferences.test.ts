import { describe, expect, it } from "vitest";
import { isPreferencesServiceUnavailable } from "@/lib/visitor-preferences";

describe("visitor preference service errors", () => {
  it("recognizes unavailable load and save responses", () => {
    expect(isPreferencesServiceUnavailable(new Error("Preferences could not be loaded (503)"))).toBe(true);
    expect(isPreferencesServiceUnavailable(new Error("Preferences could not be saved (503)"))).toBe(true);
  });

  it("does not classify unrelated errors as service outages", () => {
    expect(isPreferencesServiceUnavailable(new Error("Preferences could not be loaded (500)"))).toBe(false);
    expect(isPreferencesServiceUnavailable(new TypeError("Network request failed"))).toBe(false);
  });
});
