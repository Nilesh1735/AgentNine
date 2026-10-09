# AgentNine deployment advisor brief

**Prepared:** 2026-10-09  
**Purpose:** Give a deployment advisor enough verified repository context to compare hosting options. This is not a deployment runbook and does not assert that production services are configured or healthy.

## Request for the advisor

Recommend the best deployment platform for this repository. Compare two or three realistic choices against the constraints I provide below. Inspect the linked source files where possible, and clearly separate repository facts from assumptions.

For each option, explain:

- Whether the existing application can deploy without code changes.
- Required application, build, routing, or infrastructure changes.
- Compatibility with the Next.js server runtime, API routes, response headers, image optimization, and scheduled task.
- How Supabase, Redis rate limiting, contact delivery, and report forwarding would be configured.
- Free-tier and paid-plan limits that matter to this project, including commercial-use restrictions. Verify current plan terms rather than relying on old pricing.
- Likely recurring costs at low traffic and what could cause costs to rise.
- Secret/environment-variable management, logs, monitoring, backups, regional placement, rollback, and operational burden.
- Risks, lock-in, and a practical deployment checklist.

Do not assume that the platform named in a config file is already selected or deployed. Do not assume that the current domain, production secrets, provider integrations, or production security settings have been verified.

## My decision constraints

Fill these in before sending this brief if known:

- **Budget:** [monthly budget, including whether $0 is required]
- **Use:** [personal/non-commercial or commercial]
- **Traffic:** [expected visitors and request volume, or unknown]
- **Audience/region:** [primary visitor region]
- **Management preference:** [one dashboard strongly preferred, or separate services are acceptable]
- **Operations experience:** [beginner / comfortable with deployment and provider dashboards]
- **Downtime tolerance:** [acceptable outage/recovery expectations]
- **Domain:** [domain owned or planned; do not include account credentials]

## Product and runtime summary

AgentNine is a source-linked directory of AI-agent projects. Visitors browse and search the catalog, inspect project source, version, setup, access, and verification details, compare and save projects, and use contact/report forms. The site is not a static-only marketing page: it includes server-rendered routes, server-side API handlers, authenticated account features, admin operations, and database-backed content.

Repository facts:

- Next.js **16.3.8**, App Router, React **19.2.8**, TypeScript, and Tailwind CSS v4.
- Node.js **22** is the version used by CI. npm lockfile is committed; deployments should use `npm ci`.
- Production build command: `npm run build`.
- Runtime command: `npm run start` (`next start`).
- No `output: "export"` static-export configuration is present. The app needs a compatible Next.js server or hosting adapter; do not treat it as a static site without proposing and validating a deliberate architecture change.
- The application uses Supabase Postgres/Auth, Upstash Redis REST for distributed rate limits, and optional external contact/report delivery providers.
- Some public pages and metadata depend on the live Supabase catalog. Without Supabase configuration/data, the local app renders an empty directory rather than inventing agent listings.
- `next.config.ts` sets security headers, including Content-Security-Policy, Referrer-Policy, X-Content-Type-Options, X-Frame-Options, Permissions-Policy, and production HSTS. Confirm the chosen host and any reverse proxy preserve or correctly supplement these headers. The hosting/domain layer must also redirect HTTP to HTTPS.
- Production browser source maps are disabled in `next.config.ts`.
- Local fonts and static assets are in `public/`. Next.js image optimization is used for the founder portrait.
- The app has light/dark themes and consent-controlled analytics. Analytics is off until consent is granted.

## Main application surfaces

The repository includes:

- Public home, search, category index/details, agent detail/setup guides, comparison, FAQ, methodology, about, join, and contact pages.
- Login, signup, Google OAuth callback, password recovery/reset, account/profile, saved-agent, and account-deletion flows.
- A protected admin dashboard for catalog operations, verification, metadata refresh, audit history, login outcomes, broken-link reports, and aggregate analytics.
- API routes for preferences, analytics, feedback, contact, reporting, account deletion, admin auth/operations/catalog/metadata/verification, and trending-candidate intake.
- Discovery routes/assets: `/robots.txt`, `/sitemap.xml`, `/llms.txt`, and `/icon.svg`.

These are source-level capabilities, not proof that the corresponding live database, OAuth provider, external services, or production environment is configured.

## External services and platform requirements

| Service | Use in this project | Deployment consideration |
|---|---|---|
| Supabase Postgres | Published catalog, setup guides, visitor preferences, analytics/feedback, reports, contributions, admin data | Configure project URL and public anon key; apply the ordered SQL migrations. Keep the service-role key server-only. Confirm region, backup/PITR, RLS, and Auth settings. |
| Supabase Auth | Email/password and Google sign-in, account and saved-agent workflows | Configure allowed redirect URLs and OAuth provider credentials. Test production callbacks and account flows after deployment. |
| Upstash Redis REST | Shared atomic rate limiting for production | Required by the production configuration check. The app fails closed for rate-limited operations if the shared limiter is unavailable. |
| Contact provider | Contact form delivery through either a configured Lambda-compatible endpoint or Resend | Configure one supported delivery path and test it. Resend requires a verified sender and server-only API key. |
| Report-forwarding endpoint | Optional external forwarding after a broken-link report is queued in Supabase | `REPORT_LAMBDA_URL` is optional in the production configuration check, but reports remain queued if forwarding is missing or fails. |
| GitHub API | Repository metadata refresh and candidate discovery | `GITHUB_TOKEN` is optional to the config checker but useful for API limits. The deployment checkpoint says the old token must be revoked/replaced; verify that this was completed before enabling these operations. |
| Scheduled task | `GET /api/admin/agents/metadata`, declared as `0 5 * * 1` (Mondays at 05:00 UTC on Vercel) in `vercel.json` | This declaration is a Vercel-specific configuration hint, not evidence that Vercel is selected or that the cron is active. For another scheduler, confirm its timezone semantics, authentication, and delivery behavior. The route needs production secrets and must be verified on the selected host. |

## Environment-variable names

The values below are intentionally omitted. Supply actual values only through the chosen host's secure environment-variable manager, never in this document or a public issue.

### Required by the production configuration check

- `NEXT_PUBLIC_SITE_URL`: HTTPS origin only, with no path or trailing slash. Used for canonical URLs and discovery metadata.
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`: server-side only; never expose in browser code.
- `ADMIN_DASHBOARD_KEY`: high-entropy shared admin key. Admin authentication is not named-user administration and does not provide per-person roles or MFA.
- `NEXT_PUBLIC_CONTACT_EMAIL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `CRON_SECRET`
- `TRUSTED_PROXY_HEADERS`: production check requires `true`, but set it only after confirming the selected proxy sanitizes forwarding/IP headers as expected.

### Contact delivery: configure one supported option

- `CONTACT_LAMBDA_URL`, or
- Both `RESEND_API_KEY` and `CONTACT_FROM_EMAIL`.

### Optional or feature-dependent

- `REPORT_LAMBDA_URL`: broken-link reports can remain queued without external forwarding.
- `GITHUB_TOKEN`: recommended for GitHub API rate limits and metadata operations.

`NEXT_PUBLIC_*` variables are intended for browser exposure. Never use that prefix for secrets. `.env.example` lists the variable names but contains no credentials.

## Database and deployment status

- SQL application order is documented in [`supabase/MIGRATIONS.md`](supabase/MIGRATIONS.md). Apply one migration at a time in manifest order; never run the directory as an alphabetical batch.
- The manifest currently runs from baseline migrations 001 and 002, skips retired IDs 003-005, then applies active migrations 006-032.
- The per-project [`supabase/DEPLOYMENT-CHECKPOINT.md`](supabase/DEPLOYMENT-CHECKPOINT.md) records migrations through 032 as user-reported complete, with selected live checks also recorded as user-reported evidence. This repository does not have a standard Supabase migration ledger, and these claims are not an independent current connection to the database.
- Before deploying, independently verify the target Supabase project reference, applied migration state, required schema/RLS/functions, published catalog data, and Auth configuration.
- The production domain, active hosting provider, DNS/HTTPS behavior, live secrets, provider integrations, monitoring, backups, and restore process are **not verified by this repository**.

## Build, CI, and release checks

The GitHub Actions workflow runs on pull requests and pushes to `main`, using Node 22 and `npm ci`. It runs whitespace, migration, static UX/security checks, typecheck, lint, tests, build, admin-boundary and route checks, and a production dependency audit.

Useful local commands:

```bash
npm ci
npm run check:production-config
npm run check:migrations
npm run check:ux
npm run check:anti-vibe
npm run typecheck
npm run lint
npm test
npm run build
npm run check:admin-security
npm run check:routes
npm run test:e2e
```

The production configuration check validates required variable presence and HTTPS URL shape, not whether credentials work. The migration check compares the repository manifest to SQL files; it does not query Supabase. Route smoke checks do not establish live database, authenticated-flow, contact-delivery, or production-host health. The browser suite is model-free and does not test every authenticated/admin or external integration.

Recent local verification on 2026-10-09: `npm run build` passed after a homepage metadata edit. This is a repository build only; it is not a deployment or a live-provider smoke test.

## Known risks and open decisions for deployment advice

1. The real budget, commercial-use status, expected traffic, visitor region, downtime target, and tolerance for multiple provider dashboards have not been provided.
2. Confirm current free-tier terms and commercial restrictions. In particular, do not assume that a free tier is suitable for a commercial project.
3. Choose a host that supports Next.js 16 server rendering, route handlers, required headers, the weekly scheduled endpoint, and the app's image/font usage without silently dropping functionality.
4. Estimate costs across the host, Supabase, Upstash, email/contact provider, domain, and any monitoring/backup services. Avoid comparing only the web-host price.
5. Confirm scheduled-task frequency and authentication on the selected platform. Do not assume `vercel.json` schedules tasks on another provider.
6. Decide how secrets are separated between preview and production environments and how rotations are tested.
7. Define independent production validation for OAuth, admin actions, saved-agent isolation, contact email, report queue/forwarding, rate limiting, backups, alerts, rollback, and recovery.
8. Legal operator identity, jurisdiction, retention settings, and final legal review remain owner/counsel decisions, not hosting-platform settings.

## Source files to inspect

- [`package.json`](package.json): runtime versions, dependencies, and scripts.
- [`package-lock.json`](package-lock.json): locked npm dependency tree.
- [`next.config.ts`](next.config.ts): response headers and Next.js settings.
- [`vercel.json`](vercel.json): current scheduled-task declaration only.
- [`.env.example`](.env.example): variable names, with blank values.
- [`.github/workflows/ci.yml`](.github/workflows/ci.yml): CI environment and validation sequence.
- [`scripts/production-config-check.mjs`](scripts/production-config-check.mjs): production configuration requirements and shape checks.
- [`README.md`](README.md): local setup, service behavior, release checks, and product limitations.
- [`supabase/MIGRATIONS.md`](supabase/MIGRATIONS.md): authoritative migration order and recovery instructions.
- [`supabase/DEPLOYMENT-CHECKPOINT.md`](supabase/DEPLOYMENT-CHECKPOINT.md): project-specific, user-reported database setup record.

## Safe sharing checklist

- Share this file and, if the advisor can inspect source, a private repository link or the listed non-secret config/docs files.
- Never share `.env.local`, populated environment files, API tokens, passwords, database connection strings, OAuth client secrets, or service-role keys.
- Redact account IDs, project references, private URLs, and personal contact information if those are not intended for the advisor.
- Ask the advisor to label any uncertain claim as an assumption and verify time-sensitive pricing, quotas, and plan terms against current provider documentation.
