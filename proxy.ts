import { NextRequest, NextResponse } from "next/server";
import { isRestrictedCountry } from "./lib/region-access";

const restrictedRegionPage = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="robots" content="noindex, nofollow">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Service unavailable in your region | AgentNine</title>
  </head>
  <body>
    <main>
      <h1>AgentNine is not available in your region</h1>
      <p>AgentNine is not offered in the European Economic Area, the United Kingdom, or Switzerland.</p>
      <p>If you believe you are seeing this in error, contact <a href="mailto:info@agentnine.pro">info@agentnine.pro</a>.</p>
    </main>
  </body>
</html>`;

export function proxy(request: NextRequest) {
  const countryCode = request.headers.get("x-vercel-ip-country");
  if (!isRestrictedCountry(countryCode)) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      {
        error: "AgentNine is not available in your region.",
        contact: "info@agentnine.pro",
      },
      {
        status: 403,
        headers: {
          "Cache-Control": "private, no-store",
          "X-Robots-Tag": "noindex, nofollow",
        },
      },
    );
  }

  return new NextResponse(restrictedRegionPage, {
    status: 403,
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export const config = {
  matcher: ["/:path*"],
};
