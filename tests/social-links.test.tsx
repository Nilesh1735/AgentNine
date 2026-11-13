import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SocialLinks } from "../components/SocialLinks";

describe("SocialLinks portfolio links", () => {
  it("renders the supplied favicon inside an accessible external portfolio link", () => {
    const markup = renderToStaticMarkup(
      <SocialLinks
        label="Nilesh Raj social profiles"
        links={[
          {
            platform: "Portfolio",
            href: "https://nileshraj.pro",
            iconSrc: "/nilesh-portfolio-favicon.png",
          },
        ]}
      />,
    );

    expect(markup).toContain('aria-label="Nilesh Raj social profiles: Portfolio"');
    expect(markup).toContain('href="https://nileshraj.pro"');
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('rel="noopener noreferrer"');
    expect(markup).toContain('src="/nilesh-portfolio-favicon.png"');
  });
});
