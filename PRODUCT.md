# AgentNine Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People evaluating open-source AI agent projects and their setup requirements. AgentNine's team maintains the directory and publishes AI news; Ali Sibtain has news-editor access.

## Product Purpose

Help people find AI agent projects and evaluate their sources, setup guidance, requirements, and documented access before running them.

## Positioning

AgentNine is an independent directory that keeps upstream project sources, setup guidance, and system-access details together for each listing.

## Operating Context

Visitors browse, search, compare, and follow individual setup guides. The team maintains the catalog and publishes news articles through a separate news editor.

## Capabilities and Constraints

- The site uses Next.js App Router and Supabase.
- Public news content is available to everyone; only published posts are public and indexable.
- The news editor uses a server-only `NEWS_EDITOR_KEY` and has no access to the existing admin dashboard or agent-management APIs.
- The existing regional access restriction remains in effect.
- News article content is authored in Markdown.

## Brand Commitments

- The product name is AgentNine.
- New surfaces must inherit the existing AgentNine visual theme.

## Evidence on Hand

- The live catalog contains public AI agent setup guides and category pages.
- Existing code provides the AgentNine wordmark, red accent palette, and light/dark themes.

## Product Principles

- Make upstream sources and setup details easy to inspect.
- Keep public content and private editing capabilities separate.
- Publish only useful, accurate information; do not imply that a listing guarantees safety or compatibility.
