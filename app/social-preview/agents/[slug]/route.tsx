import { ImageResponse } from "next/og";
import { getAgent } from "@/lib/data";

export const revalidate = 3600;

const IMAGE_SIZE = { width: 1200, height: 630 };
const MAX_DESCRIPTION_LENGTH = 112;

function truncateDescription(description: string): string {
  const normalized = description.replace(/\s+/g, " ").trim();
  if (normalized.length <= MAX_DESCRIPTION_LENGTH) return normalized;
  return `${normalized.slice(0, MAX_DESCRIPTION_LENGTH - 3).trimEnd()}...`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const agent = await getAgent(slug);

  if (!agent) return new Response("Agent not found", { status: 404 });

  const description = truncateDescription(agent.short_description);
  const titleSize = agent.name.length > 22 ? 66 : 84;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "56px 76px",
          backgroundColor: "#d51221",
          color: "#fffafa",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "-1px",
          }}
        >
          <span>agentnine.</span>
          <span style={{ fontSize: 18, fontWeight: 500, letterSpacing: "1px" }}>
            OPEN-SOURCE AI AGENT
          </span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            paddingTop: 26,
          }}
        >
          <div
            style={{
              display: "flex",
              maxHeight: 210,
              overflow: "hidden",
              fontSize: titleSize,
              fontWeight: 700,
              letterSpacing: "-3px",
              lineHeight: 1.04,
              overflowWrap: "anywhere",
            }}
          >
            {agent.name}
          </div>
          {description ? (
            <div
              style={{
                display: "flex",
                maxHeight: 84,
                marginTop: 24,
                overflow: "hidden",
                fontSize: 26,
                lineHeight: 1.35,
              }}
            >
              {description}
            </div>
          ) : null}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "monospace",
            fontSize: 19,
          }}
        >
          <span>setup &amp; access guide</span>
          <span>agentnine.pro/agents/{agent.slug}</span>
        </div>
      </div>
    ),
    {
      ...IMAGE_SIZE,
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
