import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { THEME_BOOT_SCRIPT, THEME_COOKIE_NAME, decideTheme, isTheme, restoreThemeCookie } from "@/lib/theme-boot";

describe("theme boot script", () => {
  it("reads the theme cookie and falls back to the operating system preference", () => {
    expect(THEME_BOOT_SCRIPT).toContain("agentnine_theme");
    expect(THEME_BOOT_SCRIPT).toContain("prefers-color-scheme: dark");
  });

  it("is wrapped so a blocked-cookie environment cannot stop rendering", () => {
    expect(THEME_BOOT_SCRIPT).toContain("try{");
    expect(THEME_BOOT_SCRIPT).toContain("catch(e){}");
  });

  it("contains no closing script tag that could break the inline block", () => {
    expect(THEME_BOOT_SCRIPT.toLowerCase()).not.toContain("</script");
  });

  it("names the cookie consistently", () => {
    expect(THEME_COOKIE_NAME).toBe("agentnine_theme");
    expect(THEME_BOOT_SCRIPT).toContain(THEME_COOKIE_NAME);
  });

  it("accepts only the two supported themes", () => {
    expect(isTheme("light")).toBe(true);
    expect(isTheme("dark")).toBe(true);
    expect(isTheme("solarized")).toBe(false);
    expect(isTheme(undefined)).toBe(false);
  });
});

describe("theme boot script evaluated in a document", () => {
  function run(cookie: string, prefersDark: boolean) {
    const element = { dataset: {} as Record<string, string> };
    const documentStub = { cookie, documentElement: element };
    const windowStub = { matchMedia: () => ({ matches: prefersDark }) };
    new Function("document", "window", THEME_BOOT_SCRIPT)(documentStub, windowStub);
    return element.dataset.theme;
  }

  it("applies a saved dark choice", () => {
    expect(run("agentnine_theme=dark", false)).toBe("dark");
  });

  it("lets an explicit light choice win over a dark operating system", () => {
    expect(run("agentnine_theme=light", true)).toBe("light");
  });

  it("follows the operating system when no choice is saved", () => {
    expect(run("", true)).toBe("dark");
    expect(run("", false)).toBe("light");
  });

  it("ignores an unrelated cookie of a similar name", () => {
    expect(run("not_agentnine_theme=dark", false)).toBe("light");
  });

  it("ignores an invalid stored value", () => {
    expect(run("agentnine_theme=neon", false)).toBe("light");
  });
});

describe("decideTheme", () => {
  // Exercises the function the component actually calls, so a regression in
  // ThemeToggle's logic fails here rather than passing a restated copy.
  it("leaves the document alone when there is no explicit choice", () => {
    expect(decideTheme(null, "dark").documentWrite).toBeNull();
    expect(decideTheme(null, null).documentWrite).toBeNull();
  });

  it("shows the system-resolved theme instead of defaulting to light", () => {
    // The regression: boot painted dark, hydration displayed light and wrote it.
    expect(decideTheme(null, "dark")).toEqual({ displayed: "dark", documentWrite: null });
  });

  it("falls back to light only when nothing has been resolved", () => {
    expect(decideTheme(null, null).displayed).toBe("light");
  });

  it("lets an explicit choice win and write through", () => {
    expect(decideTheme("light", "dark")).toEqual({ displayed: "light", documentWrite: "light" });
    expect(decideTheme("dark", "light")).toEqual({ displayed: "dark", documentWrite: "dark" });
  });
});

describe("restoreThemeCookie after a failed save", () => {
  const written: string[] = [];
  const documentStub = {
    _cookie: "",
    get cookie() { return this._cookie; },
    set cookie(value: string) { written.push(value); },
  };

  beforeEach(() => {
    written.length = 0;
    (globalThis as { document?: unknown }).document = documentStub;
  });

  afterEach(() => {
    delete (globalThis as { document?: unknown }).document;
  });

  it("clears the cookie when the visitor had none", () => {
    // The regression: snapshotting the applied theme pinned a cookie for a
    // visitor who had been following the operating system.
    restoreThemeCookie(null);
    expect(written).toHaveLength(1);
    expect(written[0]).toContain("Max-Age=0");
  });

  it("puts back the exact cookie the visitor had", () => {
    restoreThemeCookie("dark");
    expect(written).toHaveLength(1);
    expect(written[0]).toContain("agentnine_theme=dark");
    expect(written[0]).toContain("Max-Age=31536000");
  });
});
