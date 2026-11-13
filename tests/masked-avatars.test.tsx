import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MaskedAvatars } from "../components/ui/masked-avatars";

describe("MaskedAvatars image delivery", () => {
  it("preserves remote defaults while optimizing local avatars", () => {
    const defaultMarkup = renderToStaticMarkup(<MaskedAvatars />);
    const localMarkup = renderToStaticMarkup(
      <MaskedAvatars avatars={[{ avatar: "/team.webp", name: "Team" }]} size={32} />,
    );

    expect(defaultMarkup).toContain('src="https://i.pravatar.cc/150?u=a"');
    expect(defaultMarkup).not.toContain("/_next/image?url=https%3A%2F%2Fi.pravatar.cc");
    expect(localMarkup).toContain('srcSet="/_next/image?url=%2Fteam.webp');
  });
});
