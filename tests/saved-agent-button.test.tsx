import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SavedAgentButton } from "../components/SavedAgentButton";

describe("SavedAgentButton", () => {
  it("exposes the visible action label to assistive technology", () => {
    const markup = renderToStaticMarkup(<SavedAgentButton agentId="agent-1" />);

    expect(markup).toMatch(/<button[^>]*aria-pressed="false"><span>Save agent<\/span><\/button>/);
  });
});
