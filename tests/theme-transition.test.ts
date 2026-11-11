import { describe, expect, it } from "vitest";
import {
  clampInkOrigin,
  isInvalidStateError,
  shouldUseViewTransition,
  themeTransitionDurations,
} from "@/lib/theme-transition";

describe("ink theme reveal", () => {
  it("keeps the reveal origin inside the viewport", () => {
    expect(clampInkOrigin({ x: 82, y: 44 }, 1440, 900)).toEqual({ x: 82, y: 44 });
    expect(clampInkOrigin({ x: -20, y: 950 }, 1440, 900)).toEqual({ x: 0, y: 900 });
  });

  it("keeps the reveal within a short, responsive transition", () => {
    expect(themeTransitionDurations.ink).toBe(520);
  });

  it("skips document transitions while the page is hidden or motion is reduced", () => {
    expect(shouldUseViewTransition("hidden", false, true)).toBe(false);
    expect(shouldUseViewTransition("visible", true, true)).toBe(false);
    expect(shouldUseViewTransition("visible", false, false)).toBe(false);
    expect(shouldUseViewTransition("visible", false, true)).toBe(true);
  });

  it("recognizes an aborted transition without masking unrelated errors", () => {
    expect(isInvalidStateError({ name: "InvalidStateError" })).toBe(true);
    expect(isInvalidStateError(new Error("other failure"))).toBe(false);
    expect(isInvalidStateError(null)).toBe(false);
  });
});
