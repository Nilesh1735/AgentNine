# AgentNine

AgentNine is a source-linked directory of AI-agent projects. It is a Next.js App Router application with search, setup guides, user accounts, comparison, a Supabase data layer, and an admin console. This README and the source describe the current implementation; the original product brief is preserved in [`docs/history/CLAUDE_PROMPT.md`](docs/history/CLAUDE_PROMPT.md).

For a navigable documentation index and repository map, see [`docs/README.md`](docs/README.md). The source-backed implementation, design rules, and historical audits are linked there. When documents disagree, current source code and the ordered Supabase migration guide take precedence over historical plans and audit snapshots.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app requires Supabase variables for agent listings. Without them, it shows an empty agent directory and uses only fallback category labels.

## Contents

- [Run locally](#run-locally)
- [Repository layout](#repository-layout)
- [Optional Supabase setup](#optional-supabase-setup)
- [Scripts](#scripts)
- [Service and release targets](#service-and-release-targets)
- [SEO and discovery](#seo-and-discovery)
- [Project map](#project-map)
- [Legal launch checklist](#legal-launch-checklist)
- [Current product scope and limitations](#current-product-scope-and-limitations)

## Repository layout

```text
app/             Next.js routes, layouts, API endpoints, and route-level styles
components/      Shared page components and UI primitives
lib/             Data access, domain logic, validation, and service integrations
public/          Static images, fonts, and site assets
data/            Bundled reference material and preserved research snapshots
scripts/         Repository checks and operational validation scripts
supabase/        SQL schema, migrations, and database runbooks
tests/           Unit, request, component, and browser test sources
docs/            Project reference, design rules, audits, and historical brief
.github/         CI workflow definitions
```

`docs/README.md` explains where to start and how the documentation relates to the source. Root-level configuration files such as `package.json`, `tsconfig.json`, `next.config.ts`, and `vitest.config.ts` stay at the root because the ecosystem tools expect them there.

## Optional Supabase setup

1. Create a Supabase project.
2. Apply `supabase/MIGRATIONS.md` in its numbered order. It includes the
   migration dependencies, exact release checks, and non-destructive recovery
   procedure. Catalog source references are in
   `supabase/CATALOG-SOURCES.md`. Do not run the SQL directory as an
   alphabetical batch.
3. After checking a listing's repository, version, install path, and first run,
   record evidence in `agent_verifications`. Do not set `verification_score = 5`
   from README review alone.
4. Copy `.env.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SITE_URL=https://agentnine.pro
NEXT_PUBLIC_CONTACT_EMAIL=info@agentnine.pro
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=server-only-service-role-key
ADMIN_DASHBOARD_KEY=strong-server-only-dashboard-key
CONTACT_LAMBDA_URL=
RESEND_API_KEY=
CONTACT_FROM_EMAIL=
REPORT_LAMBDA_URL=https://your-report-endpoint.example
```

Contact form delivery can use either a `CONTACT_LAMBDA_URL` handler or Resend. During local development, if `CONTACT_FROM_EMAIL` is unset, the app uses Resend's `onboarding@resend.dev` test sender, which can deliver only to the email address associated with your Resend account. Production requires setting `CONTACT_FROM_EMAIL` to a sender on a domain verified with Resend, such as `AgentNine <contact@agentnine.pro>`. Set `RESEND_API_KEY` to the provider key. The app sends messages to `NEXT_PUBLIC_CONTACT_EMAIL` and sets the submitter's address as `Reply-To`. Keep `RESEND_API_KEY` server-only. Without either delivery option, the form will not send; the visible `mailto:` address is a manual fallback.

The server data layer reads published agents and categories. The local fallback does not invent agent records. The anon key is safe to expose when the included RLS policies are enabled. Never put a service role key in client code.

The directory supports related agents, upstream freshness sorting, and URL-synced filters for category, operating system, API-key requirement, verification, and recent updates. Related-agent views use the bounded `get_related_agents` database RPC after migration 023, with the cached published catalog as an explicit compatibility fallback. Feedback uses a random visitor identifier held in an HttpOnly cookie. Theme, consent, comparison selection, setup progress, and recent agent names are stored in Supabase by migration 020; the browser does not use localStorage or sessionStorage for app preferences. Analytics remains disabled until database-backed consent is granted and stores event names, path-only page locations, random session IDs, and bounded properties; it does not include raw search text or query strings. Request IPs may be processed by the host and hashed for distributed rate limits; admin login outcomes and available client IPs are retained in a restricted security log. See the Privacy and Cookies pages for cookie use, database processing, and retention configuration. The `/admin` route exchanges `ADMIN_DASHBOARD_KEY` for a one-hour signed HttpOnly session cookie and CSRF token; mutations require same-origin requests and the CSRF header. The operations panel provides audit history, login outcomes without IP display, stale metadata, queued broken-link reports, and aggregate daily analytics; these views require migration 023. `ADMIN_DASHBOARD_KEY` is required and missing configuration fails closed; there is no hardcoded session-secret fallback. All rate-limited API paths use Upstash Redis REST with atomic increments and fixed-window expiry. The shared limiter fails closed in production if credentials are absent, invalid, or unavailable; local development and tests use an in-memory store. Set `TRUSTED_PROXY_HEADERS=true` only after confirming the production reverse proxy sanitizes forwarding headers. `status = 'archived'` is the canonical archive state and the migration keeps `is_archived` synchronized for legacy compatibility. Catalog writes use the server-only service-role client. After migration 022, each individual verification evidence insert updates its checklist score, date, commit, setup evidence, and notes through a database trigger in the same transaction. Bulk verification continues to record one checklist and shared note across selected agents; each record should be assessed on its own evidence before a listing is described as tested or safe. The current admin form records one bounded note per verification submission, not one note per checklist item. Account deletion first purges account-linked and legacy exact-email contribution rows through the service-role RPC from migration 023, then deletes the Auth user; database cascades remove saved-agent, category-follow, and saved-agent history. If contribution purging fails, the Auth account is left active and deletion returns an error. Anonymous feedback/analytics and admin login records are not linked to the account and follow their separate retention policy.

Public agent and category reads use a 60-second Next.js data cache; successful admin catalog, verification, and repository-metadata writes invalidate the agent cache immediately. Direct database edits outside the app appear after the cache lifetime. Search and filter changes update the URL in the browser without requesting a new server render, since filtering runs against the already-loaded catalog. Search outcome events are sent together in one analytics request, and links repeated in large or animated catalog lists do not prefetch every destination in the background.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run test:watch
npm run check:anti-vibe
npm run check:ux
npm run check:production-config
npm run check:migrations
npm run check:admin-security
npm run check:routes
npm run build
npm run start
```

## Service and release targets

The web service is a Next.js 16 server. The repository includes a `vercel.json`
scheduled metadata-refresh declaration, but that file alone does not confirm
which provider or schedule is active in production. Supabase is the stateful
service and must be migrated separately using
`supabase/MIGRATIONS.md`; a successful web build does not prove that the live
database is current.

Before a release, run `npm ci`, `npm run check:production-config` with production environment variables,
`npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and
`npm run check:routes`. CI runs the automated validation suite on every pull
request and push to `main`. The release owner should also confirm
the Supabase migration ID, a recent backup/PITR checkpoint, HTTPS site URL,
server-only keys, cron secret, and a working contact endpoint.

The deploy target is the service described by `NEXT_PUBLIC_SITE_URL`. The
runtime target is `npm run start` with `NODE_ENV=production`; it must receive
the variables in `.env.example`, including `SUPABASE_SERVICE_ROLE_KEY` and
`ADMIN_DASHBOARD_KEY` only on the server. Roll back the application to the
previous build if checks fail, but use the forward-only recovery process in
`supabase/MIGRATIONS.md` for database mismatches.

`check:anti-vibe` is a conservative release guard for public TSX. It reports images without explicit `alt` text, statically empty button/link labels, fake `#` links, literal loading copy without a status/ARIA signal, and detectable `localhost` values in metadata/JSON-LD. It also checks for accidental service-role exposure patterns and tracked `.env.local` files. Props supplied through spreads and dynamic JSX are intentionally left to framework linting to avoid false positives. CI runs this check before typechecking, linting, and building; it is not a substitute for a security review.

`check:production-config` runs automatically in production and fails when required deployment configuration is missing or the public site URL is not an HTTPS origin. Production also requires `NEXT_PUBLIC_CONTACT_EMAIL`, either `CONTACT_LAMBDA_URL` or both `RESEND_API_KEY` and `CONTACT_FROM_EMAIL`, both Upstash REST variables, `CRON_SECRET` for the scheduled metadata refresh, and confirmation that `TRUSTED_PROXY_HEADERS=true` is appropriate for the configured proxy. Production hosts must redirect HTTP to HTTPS as well as return HSTS; configure and verify that redirect at the hosting/domain layer. Set `CHECK_PRODUCTION_CONFIG=1` to run the variable checks locally without changing `NODE_ENV`.

`check:routes` verifies the key App Router page modules, metadata handlers, favicon, and social image are present. After a build it starts a short-lived production server and checks the primary pages plus `/robots.txt`, `/sitemap.xml`, and `/llms.txt`; set `ROUTE_SMOKE_URL` to check an already-running deployment instead. If a production server cannot be started, it exits successfully after the source/config checks, so it remains usable in environments without a build or with unavailable runtime services. It does not crawl dynamic slugs, exercise authenticated APIs, validate database contents, or replace browser, accessibility, or end-to-end tests. Use `npm run check:routes -- --source-only` to explicitly run only the repository checks.

`check:admin-security` verifies the unauthenticated admin page/API boundary, including the new operations endpoints, plus wrong-origin login/logout rejection. It uses an existing local server at `http://127.0.0.1:3000` when available; otherwise, after a build, it starts and stops a temporary production server. Set `ADMIN_SECURITY_URL` to target an explicit running server. It intentionally does not create a valid live admin session.

`npm test` runs the dependency-light Vitest baseline in `tests/`: pure configuration/rate-limit checks and request-level validation/security cases for public API routes. These tests deliberately omit Supabase credentials and mock no live services. `npm run test:e2e` runs the model-free TesterArmy browser suite against `APP_URL` (default `http://localhost:3000`); start the app with `npm run dev` first. The suite covers public navigation, directory search, an agent guide, comparison, FAQ/theme controls, contact-form rendering without submitting it, and the narrow-screen menu. It does not exercise authenticated or admin flows, production email delivery, or live database writes.

API bodies are bounded before parsing (with smaller limits for public/reporting requests and larger limits for admin agent forms). Rate limiting uses the shared atomic Upstash Redis REST implementation when configured. Only local development and tests use the in-process fallback; production fails closed when shared rate limiting is missing or unavailable. Rejected requests include `Retry-After` and standard `RateLimit-*` quota headers. Client IP headers are ignored unless `TRUSTED_PROXY_HEADERS=true` is explicitly set for a sanitizing reverse proxy.

### Operational targets and recovery

These are measurable MVP targets, not a claim that monitoring is installed:

- Availability target: 99.5% monthly for public pages and catalog reads, excluding planned maintenance.
- Performance target: 95% of public page/API requests complete in under 1.5 seconds at the application boundary; investigate any sustained 5-minute breach.
- Recovery objectives: RPO 24 hours (latest verified Supabase backup/PITR point) and RTO 4 hours for an application rollback or Supabase restore.
- Analytics target: review weekly event volume and API-error/zero-result rates; analytics is best-effort and must never block user actions.

Supabase operations remain manual and must use the project dashboard/runbooks: verify daily backups or PITR retention, test a non-production restore at least quarterly, and record the latest checkpoint before releases. Secret rotation is an operator task, not automated or verifiable from this repository. Record each rotation date and owner in the deployment's restricted operations log. Rotate `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_DASHBOARD_KEY`, `CRON_SECRET`, and vendor endpoint credentials through the deployment secret manager at least quarterly and immediately after suspected exposure; the admin dashboard uses one active key, so replacing it invalidates existing signed sessions and requires a fresh sign-in. Verify admin, cron, contact, and report flows after each replacement, then revoke obsolete values. Never paste credentials into issues, logs, analytics, or this repository. For recovery, freeze writes if needed, identify the last good migration and backup/PITR point, restore a clone first, apply numbered migrations from `supabase/MIGRATIONS.md`, run the release checks, then promote or roll back the application. Preserve the original project until data integrity is verified.

Release checklist: confirm CI is green; review `git diff --check`; run production-config, migration-manifest, typecheck, lint, tests, build, route smoke, and admin boundary checks; verify the migration ID and backup/PITR checkpoint in the live Supabase project; confirm HTTPS/site URL and rotated server-only secrets; smoke-test catalog, search, source links, save/compare UI, contact/report queue behavior, and admin operations; record the release commit, rollback target, migration ID, and operator. The migration-manifest check only verifies the repository list against SQL files; it does not query Supabase or prove that any migration has been applied.

## SEO and discovery

Public pages expose page-specific titles, descriptions, canonical URLs, Open Graph/Twitter metadata, JSON-LD where a structured page type applies, and internal links between categories, listings, setup guides, and the FAQ. `/robots.txt`, `/sitemap.xml`, and `/llms.txt` are generated routes. Production requires an HTTPS-origin `NEXT_PUBLIC_SITE_URL`; the production configuration check fails otherwise. Private admin, account, login, and signup surfaces remain excluded from search intentionally. The catalog uses CSS visuals rather than project thumbnails; the social preview is a compact PNG and the founder portrait is delivered through Next.js image optimization.

Backlinks cannot be created from inside the application. The ethical acquisition path is to publish genuinely useful, source-linked agent setup pages, contribute corrections to upstream documentation where appropriate, submit the directory to relevant developer directories, and earn citations through launch posts and technical write-ups. Do not buy links, automate spam outreach, or claim endorsements that do not exist.

## Project map

- `app/`: App Router pages, metadata, JSON-LD, sitemap, and the report API route
- `components/`: shared navigation, cards, search, setup stepper, and report UI
- `lib/data.ts`: Supabase data access with fallback category labels
- `supabase/MIGRATIONS.md`: numbered SQL application order and recovery runbook
- `supabase/schema.sql`: categories, agents, trending candidates, and RLS policies
- `supabase/feature-migrations.sql`: feedback, analytics, and aggregate function
- `supabase/account-features.sql`: authenticated saved-agent records
- `supabase/admin-security.sql`: admin login and change-audit grants
- `supabase/admin-session-revocation.sql`: server-side admin session invalidation

Tailwind CSS v4 is installed through `@tailwindcss/postcss` and imported from `app/globals.css`. The visual system is primarily authored in that stylesheet with CSS custom properties and component classes; some components also use Tailwind utilities.

The contact page submits to `/api/contact`, which validates and rate-limits the payload, records it in Supabase when configured, and sends it through either the locked-down `CONTACT_LAMBDA_URL` handler or Resend. Authenticated submissions are linked to the account only when the submitted email matches the verified Supabase identity. Resend requires a verified sender domain, server-only `RESEND_API_KEY`, and `CONTACT_FROM_EMAIL`; the configured `NEXT_PUBLIC_CONTACT_EMAIL` is the recipient and remains a manual `mailto:` fallback. Broken-link reports are first queued in Supabase, then forwarded to `REPORT_LAMBDA_URL` when configured; an upstream forwarding failure leaves the queued report available to the admin queue. Migration 023 is required for this queue. Password recovery uses Supabase's email flow through `/forgot-password` and `/reset-password`. Production still requires configuring and externally testing contact/report delivery.

Authentication uses Supabase Auth for email/password and Google OAuth. The OAuth callback at `/auth/callback` exchanges the provider code for a cookie-backed Supabase session and only redirects to a local path. To enable Google, enable the provider in Supabase Auth and add its Supabase callback URL (`https://<project-ref>.supabase.co/auth/v1/callback`) to the Google Cloud OAuth client's authorized redirect URIs. In Supabase Auth URL Configuration, allow the local app callback (`http://localhost:3000/auth/callback`) and the eventual HTTPS production callback (`https://<your-domain>/auth/callback`). Configure the Google client ID and secret in Supabase only; do not add them to this repository or expose them in browser environment variables.

Authentication and admin requests are exception-safe: transient network failures reset pending controls and preserve entered form data. Admin loading distinguishes unauthorized sessions from service outages and provides retry actions. Public catalog outages render a retry action and remain distinct from a genuinely empty catalog.

GitHub stars and latest repository activity can be refreshed from the admin dashboard. On Vercel, `/api/admin/agents/metadata` also runs weekly through `vercel.json`; configure the server-only `GITHUB_TOKEN` (recommended for rate limits) and `CRON_SECRET`. GitHub discovery adds recent high-star and lower-star “hidden gem” repositories to `trending_candidates` for review. It never publishes a repository automatically.

## Legal launch checklist

The [Terms of Service](/terms) and [Privacy Policy](/privacy) are product-specific drafts, not legal advice or a substitute for counsel. The jurisdiction and identity of the legal operator are not encoded in this repository, so the text cannot be final until those facts are supplied and reviewed. In particular:

- Set `NEXT_PUBLIC_CONTACT_EMAIL=info@agentnine.pro` and confirm the inbox is monitored.
- Add the final owner/company name to the legal copy; the app intentionally does not invent a personal identity.
- Confirm the owner/company name, operating location, effective dates, and governing-law language with counsel.
- Confirm every production vendor, Supabase region, subprocessors, analytics setting, and retention period. The repository does not currently enforce automatic deletion of contact submissions, analytics events, feedback, or admin login records; choose retention periods, implement/enable deletion, and document them.
- Confirm whether the deployed app has accounts, payments, cookies, advertising, or additional SDKs; update the legal pages if any are introduced.
- Confirm and implement the data-deletion/request workflow for analytics, feedback, contact submissions, and admin security records. Migration 022 cascades account-linked contributions when the Auth user is deleted; migration 023 also purges linked and legacy exact-email submissions before the account is removed. Unrelated anonymous and admin-security records are not linked to that account and need their own retention workflow.
- Configure a visible monitored privacy contact address and test the privacy request process.
- Search AgentNine and similar names across domains, social platforms, app stores, and official trademark databases before committing to the name.
- Review every generated legal statement; `[CHECK]` markers are intentional launch blockers, not claims that the item is complete.
- Human-review candidate discoveries before publishing them; verify source, license, setup, security context, and category.

The SQL directory contains historical, one-off migrations. Do not run every
file indiscriminately; the authoritative order, fresh-install guidance,
production procedure, checks, and recovery policy are in
`supabase/MIGRATIONS.md`. Verify the live Supabase schema before enabling
public feedback, analytics, or admin writes.

## Current product scope and limitations

The current repository has evolved beyond the original V1 proposal. Accounts, comparison, methodology, contribution, privacy, and admin operations are present in source; [`docs/history/CLAUDE_PROMPT.md`](docs/history/CLAUDE_PROMPT.md) remains the historical starting prompt, not a current feature boundary. This describes repository code and does not prove which features or data are live in production.

- Admin agent create/update operations use SQL RPCs that atomically write the catalog change and audit row. After migration 022, inserting verification evidence and synchronizing the agent's score/date/setup evidence/notes happen in one database transaction.
- Admin route database errors should be diagnosed from server/database logs; client-facing errors are intentionally bounded and may not expose database details.
- Analytics storage failures return a non-success API status. Analytics remains client-side best effort, so a dropped request is not retried or guaranteed to be recorded.
- Feedback summary RPC errors return an explicit unavailable response; they are not represented as a successful zero count.
- Analytics event names/properties are validated against allowlists. Raw search text is not an allowed analytics property; page paths exclude query strings.
- GitHub metadata refresh is available through protected admin/cron routes. Candidate discovery adds results to the `trending_candidates` review queue, but the admin dashboard does not yet provide a candidate review/approval/publishing workflow.
- The admin console now includes audit history, login outcome history, metadata staleness, a broken-link report queue, and daily aggregate analytics. It still has no category manager, catalog export, named admin accounts, or MFA. The admin operations views require migration 023 and were not verified against the live Supabase project.
- The repository has a focused 28-test unit/request baseline, but no browser, axe, Lighthouse, migration-integration, or authenticated end-to-end tests.
- A repository checkout does not establish how many live listings have verification evidence or who personally ran each test. A five-point score represents checklist evidence stored for a listing/version; it is not a safety certification or a claim that an agent is safe to run. Do not publish a verified-count or owner-testing claim without checking the live records and underlying evidence.
- Listings without validated `setup_steps` show a documentation-gap warning and link to the source repository's `README.md` when available. README instructions are upstream guidance only and are not presented as AgentNine-validated setup steps.
- Production deployment still requires `NEXT_PUBLIC_SITE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, a strong `ADMIN_DASHBOARD_KEY`, live migrations, TLS, distributed rate limiting, backups, monitoring, and configured contact/report services. Broken-link reports remain queued if external forwarding is not configured or fails.

Treat these items as open work, not implied capabilities.
