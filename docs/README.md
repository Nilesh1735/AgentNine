# AgentNine documentation

Start with the root [README](../README.md) for the product overview, local setup, environment variables, and release checks. This page is the index for the supporting project documents.

## Current project information

- [Implementation reference](product/PROJECT_REFERENCE.md) — source-backed product, route, design-token, validation, and readiness notes. It records the scope and limits of its own review; it is not a live deployment status page.
- [Deployment advisor brief](../deploymentguide.md) — shareable technical context and open questions for comparing hosting platforms; contains no secret values.
- [Design rules](design/DESIGN_RULES.md) — visual direction and quality constraints. Where intent differs from current behavior, use the implementation reference and source code.
- [Logo and favicon brief](design/LOGO_BRIEF.md) — a source-grounded prompt for exploring original logo directions without changing the current icon.
- [Security policy](../SECURITY.md) — responsible reporting guidance and production security boundaries.
- [Supabase migration runbook](../supabase/MIGRATIONS.md) — authoritative ordered SQL application, verification, and recovery instructions. Do not apply SQL files alphabetically.
- [Catalog sources](../supabase/CATALOG-SOURCES.md) — provenance and source links for catalog records.
- [Deployment checkpoint](../supabase/DEPLOYMENT-CHECKPOINT.md) — operator follow-ups that require checking external provider or project state.

## Historical and audit documents

- [Original product brief](history/CLAUDE_PROMPT.md) — retained for context; it is not the current feature specification.
- [Anti-vibe audit](audits/ANTI_VIBE_AUDIT.md) — dated audit snapshot, not a substitute for current source inspection.
- [Antislop audit notes](audits/anti-slop/) — dated follow-up notes.
- [Preserved GitHub page capture](../data/source-snapshots/github-instruct-pix2pix-releases.html) — an archival HTML snapshot, not application data or a live source.

## Repository map

| Path | Responsibility |
|---|---|
| `app/` | Next.js App Router pages, layouts, route handlers, and route metadata |
| `components/` | Reusable UI and page components; visual primitives live in `components/ui/` |
| `lib/` | Shared data access, domain rules, validation, and provider clients |
| `public/` | Static images, local fonts, and browser-served assets |
| `data/` | Bundled reference material and preserved source snapshots; not runtime catalog data |
| `scripts/` | Local checks for routes, migrations, configuration, UX, and security |
| `supabase/` | Database schema, ordered migrations, and database operations guidance |
| `tests/` | Automated unit, request, component, and browser tests |
| `docs/` | Maintained product, design, audit, and historical documentation |
| `.github/workflows/` | Continuous-integration workflow |

## Local-only files

The repository intentionally keeps secrets and machine-generated output out of source control. `.env.local`, dependency installations, Next.js build output, browser-test logs, and local editor/agent state are not project documentation or application source. Share the tracked repository and provide credentials through a separate, secure channel; never share a populated local environment file.

Root-level framework and package-manager configuration stays at the repository root so Next.js, TypeScript, npm, and test tooling can discover it without custom path handling.

The bundled materials under `data/skills/` are reference documents, not dependencies loaded by the application. The HTML snapshot under `data/source-snapshots/` is a preserved GitHub Releases page for `timothybrooks/instruct-pix2pix`; it is not application data or a current source of truth.

The logo-design skill is recorded in `skills-lock.json` and installed locally under the ignored `.agents/skills/` directory. To install it for GitHub Copilot in another checkout, run `npx skills add kaankiziltug/logo-design-skill --skill logo-design --agent github-copilot -y`.
