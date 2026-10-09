import { describe, expect, it } from "vitest";
import {
  formatCatalogDate,
  getCompactVersionLabel,
  getReleaseRecord,
  getRepositoryFreshnessLabel,
} from "@/lib/agent-metadata-display";

describe("agent metadata display", () => {
  it("formats dates consistently in UTC and rejects invalid dates", () => {
    expect(formatCatalogDate("2026-10-02T23:30:00-07:00")).toBe("Oct 3, 2026");
    expect(formatCatalogDate("not-a-date")).toBeNull();
    expect(formatCatalogDate(null)).toBeNull();
  });

  it("keeps card version labels concise without losing the detailed source record", () => {
    expect(getCompactVersionLabel("0.8.2 (pyproject; no GitHub release found)")).toBe("0.8.2");
    expect(getCompactVersionLabel("No GitHub release; npm dist-tag 1.74.0")).toBe("No GitHub release");
    expect(getCompactVersionLabel("repo tag v1.0.679; npm package 0.2.12")).toBe("v1.0.679");
    expect(getCompactVersionLabel("Desktop v0.0.41; CLI v3.0.68")).toBe("Multiple versions");
    expect(getCompactVersionLabel("unversioned (latest release not documented)")).toBe("Unversioned");
    expect(getCompactVersionLabel("")).toBe("Version not recorded");
  });

  it("distinguishes release evidence from an explicit absence of a GitHub release", () => {
    expect(getReleaseRecord({ version_tag: "0.8.2 (pyproject; no GitHub release found)", last_release_at: null }))
      .toBe("No GitHub release found");
    expect(getReleaseRecord({ version_tag: "v1.2.0", last_release_at: "2026-10-02T00:00:00Z" }))
      .toBe("Release date recorded: Oct 2, 2026");
    expect(getReleaseRecord({ version_tag: "unversioned", last_release_at: null }))
      .toBe("No versioned release identified");
  });

  it("prefers the metadata-check date over commit activity", () => {
    const agent = {
      metadata_last_checked_at: "2026-10-02T00:00:00Z",
      last_commit_at: "2026-09-30T00:00:00Z",
    };

    expect(getRepositoryFreshnessLabel(agent)).toBe("Checked Oct 2, 2026");
  });

  it("does not substitute upstream activity where only a repository check is requested", () => {
    const agent = { metadata_last_checked_at: null, last_commit_at: "2026-09-30T00:00:00Z" };

    expect(getRepositoryFreshnessLabel(agent, false)).toBe("Not checked");
    expect(getRepositoryFreshnessLabel(agent)).toBe("Commit Sep 30, 2026");
  });
});
