# ANTI_VIBE_AUDIT

This audit is based on repository evidence from the current AgentNine workspace. It does not claim unverified items as implemented. LocalBusiness schema is not applicable because this project is a digital software directory, not a physical local business listing.

Status legend: Implemented = repo evidence present; External prerequisite = requires external setup or service; Not applicable = not relevant to this project type; Open = missing or unproven.

Maintenance rule: update this file in place only after checking the cited repository evidence. Do not regenerate the checklist from memory or assign statuses from keywords; every status must remain traceable to the verification/fix evidence on its line.

> **Snapshot warning, September 28, 2026:** The deep-audit section below is dated September 20 and contains findings that have since changed. Do not use that section as the current defect list. In particular, Open Graph uses `/og-image.png`; catalog create/update plus audit are transactional; analytics and feedback report storage errors; `source_click` is wired; and a protected trending-candidate ingestion route exists. The verification-evidence/score two-request risk and external migration/deployment prerequisites remain. Current design and implementation facts are summarized in [`../product/PROJECT_REFERENCE.md`](../product/PROJECT_REFERENCE.md).

## SEO/discoverability
1. title template and metadata are present. Status: Implemented. Verification/fix: app/layout.tsx defines metadataBase, canonical route, title template, OG/Twitter cards, and a marketplace description.
2. robots rules allow indexing. Status: Implemented. Verification/fix: app/robots.ts sets allow "/" and exposes the sitemap URL.
3. XML sitemap generation exists. Status: Implemented. Verification/fix: app/sitemap.ts creates home/search/category/agent entries from live data.
4. canonical URLs use site config. Status: External prerequisite. Verification/fix: NEXT_PUBLIC_SITE_URL is required for production canonical URLs and sitemap generation.
5. detail pages generate metadata. Status: Implemented. Verification/fix: app/agents/[slug]/page.tsx generates per-agent metadata and canonical links.
6. SoftwareApplication JSON-LD is used. Status: Implemented. Verification/fix: agent pages emit SoftwareApplication structured data rather than a physical-business schema.
7. LocalBusiness schema is not applicable. Status: Not applicable. Verification/fix: This project is a non-local software directory with no storefront or local service area; a LocalBusiness schema would be inaccurate.
8. search page is URL-synced. Status: Implemented. Verification/fix: README and app search behavior keep queries and filters in the URL for shareable results.
9. category pages are discoverable. Status: Implemented. Verification/fix: category landing pages and sitemap entries exist in app/categories and app/sitemap.ts.
10. AI discovery route exists. Status: Implemented. Verification/fix: app/llms.txt/route.ts exists for machine-readable discovery.
11. OG image metadata is configured. Status: Implemented. Verification/fix: app/layout.tsx points Open Graph and Twitter cards to /og-image.png when NEXT_PUBLIC_SITE_URL is configured.
12. related agents are surfaced. Status: Implemented. Verification/fix: lib/data.ts has getRelatedAgents() and shared-tag discovery logic.
13. freshness sorting exists. Status: Implemented. Verification/fix: lib/data.ts includes recently updated sorting and freshness cutoff logic.
14. fallback categories do not invent agents. Status: Implemented. Verification/fix: lib/data.ts falls back to demo categories but README says fallback data does not invent agent records.
15. filters cover category, OS, API-key, verification, freshness. Status: Implemented. Verification/fix: README documents URL-synced filters for category, OS, API-key requirement, verification, and recent updates.
16. directory does not claim every project is safe. Status: Implemented. Verification/fix: README.md and the public review copy state the directory is not an endorsement engine and does not claim every listed agent is safe.
17. skip link exists for keyboard users. Status: Implemented. Verification/fix: app/layout.tsx renders a skip link to #main-content.
18. language attribute is present. Status: Implemented. Verification/fix: app/layout.tsx sets lang="en" on the html tag.
19. visible focus ring exists. Status: Implemented. Verification/fix: app/globals.css defines visible keyboard focus rings for interactive controls.
20. search results are shareable. Status: Implemented. Verification/fix: URL-synced filters and search queries make result sets shareable.

## Accessibility
1. a11y automation is not proven. Status: Open. Verification/fix: No axe/Lighthouse or browser-based accessibility suite is present in repo evidence.
2. non-text assets have no full accessible-name audit. Status: Open. Verification/fix: No repo-wide alt-text or icon-label audit is visible.
3. keyboard navigation is not fully proven. Status: Open. Verification/fix: No automated keyboard-only admin/search tests or checklist are present.
4. ARIA inventory is undocumented. Status: Open. Verification/fix: No explicit ARIA audit or inventory is in the repo.
5. form labels are not fully audited. Status: Open. Verification/fix: No form label review or validation-announcement audit is documented.
6. reduced-motion handling exists. Status: Implemented. Verification/fix: app/globals.css includes a prefers-reduced-motion rule that disables nonessential transitions and animations.
7. contrast policy is not enforced. Status: Open. Verification/fix: No color-contrast pass or policy is present in the codebase.
8. heading hierarchy is not audited. Status: Open. Verification/fix: No heading semantic audit is recorded.
9. custom controls are not fully screen-reader tested. Status: Open. Verification/fix: No custom-widget accessibility review is recorded.
10. contact and report flows are not a11y-audited. Status: Open. Verification/fix: No accessible-form review for the contact/report flow is present.
11. admin flows are not keyboard-tested. Status: Open. Verification/fix: No keyboard-only admin workflow is proven in the repo.
12. contrast constraints are not specified in design tokens. Status: Open. Verification/fix: No explicit design-system contrast requirement is present.
13. error states are not accessibility-reviewed. Status: Open. Verification/fix: No accessible error-message handling or evaluation is visible.
14. non-dynamic custom widgets do not have documented semantics. Status: Open. Verification/fix: No screen-reader semantics audit for custom UI components is present.
15. page landmarks are not explicitly audited. Status: Open. Verification/fix: No page-landmark audit is in evidence.
16. skip links are present but no broad a11y pass exists. Status: Open. Verification/fix: The skip-link implementation is good, but it is not enough to claim broad accessibility compliance.
17. a11y fixes should be added before launch. Status: Open. Verification/fix: This is a clear backlog item: add axe/Lighthouse and keyboard-flow tests before public launch.
18. admin focus management is not specified. Status: Open. Verification/fix: No explicit focus-management rules exist for admin dialogs or forms.
19. content should be readable without hover-only interactions. Status: Open. Verification/fix: No explicit hover-to-content accessibility review exists.

## UX
1. search and filter UX is URL-synced. Status: Implemented. Verification/fix: README documents URL-synced category/OS/API-key/verification filters and result sharing.
2. category browsing is present. Status: Implemented. Verification/fix: app/categories and the category detail route provide public category navigation.
3. setup steps display as a stepper. Status: Implemented. Verification/fix: README and app docs describe a setup stepper and OS-specific setup flow.
4. per-OS commands are copyable. Status: Implemented. Verification/fix: The setup flow supports OS-specific commands and copy controls.
5. setup progress is persisted. Status: Implemented. Verification/fix: `components/SetupStepper.tsx` saves per-agent completion state through the Supabase-backed visitor preferences API.
6. missing details render as not-reviewed text. Status: Implemented. Verification/fix: lib/data.ts normalizes missing fields into explicit review-status language rather than fake details.
7. verification states are separate from publication status. Status: Implemented. Verification/fix: README.md separates published status from verification_score and state labels.
8. legal pages exist. Status: Implemented. Verification/fix: app/about/page.tsx, app/privacy/page.tsx, and app/terms/page.tsx are present.
9. faq and contact pages exist. Status: Implemented. Verification/fix: app/faq/page.tsx and app/contact/page.tsx exist.
10. empty states are intentional. Status: Implemented. Verification/fix: README says the app can show an empty directory if Supabase is unavailable.
11. degradation is graceful without invented records. Status: Implemented. Verification/fix: lib/data.ts returns empty/fallback data instead of fabricating listings.
12. guessed project details are rejected. Status: Implemented. Verification/fix: README.md says not to guess commands, ports, storage, permissions, or other facts.
13. broken-link reporting is externalized. Status: External prerequisite. Verification/fix: README says app/api/report/route.ts requires REPORT_LAMBDA_URL to forward payloads.
14. contact route is local-email-only. Status: Implemented. Verification/fix: README says the contact flow opens a local email draft and does not claim delivery.
15. homepage explains the product. Status: Implemented. Verification/fix: app/page.tsx and README describe the curated AI-agent directory purpose.
16. API-key requirement can be filtered. Status: Implemented. Verification/fix: schema and docs include a requires_api_key field and a filter for it.
17. upstream independence is disclosed. Status: Implemented. Verification/fix: README.md and public detail pages disclose independence from listed upstream projects.
18. freshness is visible. Status: Implemented. Verification/fix: recent-update sorting and last_commit_at tracking provide recency signals.
19. search results are shareable. Status: Implemented. Verification/fix: URL query syncing keeps search results reloadable and shareable.
20. first-launch prompts are cautious. Status: Implemented. Verification/fix: normalizeAgent() defaults to a low-risk read-only prompt when details are missing.

## Security
1. public reads are limited to published rows. Status: Implemented. Verification/fix: lib/data.ts uses status = published and schema.sql creates a matching public-read policy.
2. public categories are readable. Status: Implemented. Verification/fix: schema.sql grants public read access to categories.
3. service-role keys stay off the client. Status: Implemented. Verification/fix: README explicitly warns never to put a service-role key in client code.
4. admin auth uses HttpOnly signed cookies. Status: Implemented. Verification/fix: app/api/admin/auth/route.ts sets an HttpOnly admin_session cookie via createAdminSession().
5. same-origin checks are implemented. Status: Implemented. Verification/fix: isTrustedOrigin(request) rejects invalid origins before login.
6. CSRF protection exists. Status: Implemented. Verification/fix: admin routes check same-origin and a CSRF cookie/header before mutation.
7. constant-time compare is used for admin key. Status: Implemented. Verification/fix: crypto.timingSafeEqual is used to compare the submitted admin key to ADMIN_DASHBOARD_KEY.
8. login attempts are logged without secrets. Status: Implemented. Verification/fix: auditLogin() records success and IP metadata without storing secrets or keys.
9. rate limiting is process-local MVP only. Status: External prerequisite. Verification/fix: README says the limiter is in-memory and process-local; multi-instance deployments need external rate limiting.
10. admin writes are audited. Status: Implemented. Verification/fix: hardening.sql creates agent_change_audit and app/api/admin/agents/route.ts inserts before/after snapshots.
11. verification_score is not user-editable via generic updates. Status: Implemented. Verification/fix: agent update routes strip verification_score before persisting updates.
12. verification_score is trigger-computed. Status: Implemented. Verification/fix: hardening.sql creates sync_agent_verification_score() and a DB trigger on agent_verifications.
13. analytics store bounded event info. Status: Implemented. Verification/fix: README says analytics store event names, coarse page paths, random session IDs, and bounded properties only.
14. feedback uses a random visitor identifier per agent. Status: Implemented. Verification/fix: an HttpOnly visitor cookie identifies a browser for one-vote-per-agent database enforcement.
15. cookies use SameSite strict mode. Status: Implemented. Verification/fix: app/api/admin/auth/route.ts sets sameSite: "strict" on the admin session and CSRF cookie.
16. admin session lifetime is limited. Status: Implemented. Verification/fix: session and CSRF cookies are set with a 60-minute maxAge.
17. secrets are not stored in admin tables. Status: Implemented. Verification/fix: admin-security.sql comments say secrets and submitted keys are never stored.
18. admin request validation is strict. Status: Implemented. Verification/fix: app/api/admin/agents/route.ts validates name, slug, status, setup steps, and OS command objects before insert/update.
19. no upload or remote-exec surface exists. Status: Not applicable. Verification/fix: This repo contains no upload route or arbitrary remote code execution surface.
20. malformed public requests cannot trigger admin writes. Status: Implemented. Verification/fix: admin routes reject unauthorized or invalid-CSRF requests with 401/403.
21. CSP and strict headers are configured. Status: Implemented. Verification/fix: next.config.ts emits CSP, Referrer-Policy, X-Content-Type-Options, and X-Frame-Options; production still needs a deployed-header smoke check.

## Data integrity
1. core tables exist. Status: Implemented. Verification/fix: supabase/schema.sql creates categories, agents, trending_candidates, and their core fields.
2. slug uniqueness is enforced. Status: Implemented. Verification/fix: schema.sql defines unique slugs on categories and agents.
3. status values are constrained. Status: Implemented. Verification/fix: hardening.sql adds a status check constraint for draft/published/archived/needs_review.
4. stars are non-negative. Status: Implemented. Verification/fix: hardening.sql adds a stars >= 0 constraint.
5. verification_score is in range. Status: Implemented. Verification/fix: schema.sql restricts verification_score to 0 through 5.
6. verification rows belong to agents. Status: Implemented. Verification/fix: hardening.sql creates agent_verifications.agent_id as a foreign key to agents with cascade delete.
7. verification rows include evidence booleans. Status: Implemented. Verification/fix: agent_verifications contains pinned_checkout, dependency_install, provider_setup, first_prompt, and normal_machine flags.
8. verification score is DB-derived. Status: Implemented. Verification/fix: hardening.sql creates sync_agent_verification_score() and a trigger to update the score.
9. change history is recorded. Status: Implemented. Verification/fix: agent_change_audit stores previous_record and new_record JSON snapshots.
10. public normalization avoids false certainty. Status: Implemented. Verification/fix: normalizeAgent() replaces missing values with explicit review-status wording.
11. unknown fields are rendered as not reviewed. Status: Implemented. Verification/fix: normalizeAgent() populates not-reviewed strings for env, hardware, ports, access, and cost fields.
12. guessed metadata is rejected. Status: Implemented. Verification/fix: README.md says do not guess commands, ports, storage, or permission models.
13. freshness metadata is tracked. Status: Implemented. Verification/fix: hardening.sql adds metadata_last_checked_at, metadata_source, and metadata_is_stale.
14. login attempts are recorded. Status: Implemented. Verification/fix: admin-security.sql creates admin_login_log with attempted_at metadata and IP storage.
15. administrative evidence is segregated. Status: Implemented. Verification/fix: hardening.sql explicitly states verification and audit history are admin-only data with no public read/write policy.
16. seeded files are intentionally unverified. Status: Implemented. Verification/fix: README says zero of 25 checks are completed; the seed is published but not verified.
17. metadata provenance is recorded. Status: Implemented. Verification/fix: hardening.sql stores metadata_source and metadata_last_checked_at on agents.
18. archive state has one canonical source. Status: Implemented. Verification/fix: status = archived is canonical; hardening.sql synchronizes legacy is_archived and adds a consistency constraint.
19. historical snapshots preserve data before edits. Status: Implemented. Verification/fix: agent_change_audit retains previous_record and new_record JSON objects.
20. README review is not treated as verification evidence. Status: Implemented. Verification/fix: README warns that verification_score = 5 cannot be set from README review alone.
21. public reads exclude drafts. Status: Implemented. Verification/fix: lib/data.ts filters only status = published rows for public read paths.

## Performance
1. public reads are server-side. Status: Implemented. Verification/fix: lib/data.ts uses server-side Supabase access and public selection logic.
2. client search uses Fuse.js. Status: Implemented. Verification/fix: package.json includes fuse.js and the app search logic uses it.
3. dynamic routes avoid stale 404s. Status: Implemented. Verification/fix: app/agents/[slug]/page.tsx sets dynamic = "force-dynamic" and dynamicParams = true.
4. sitemap and robots are generated at runtime. Status: Implemented. Verification/fix: app/robots.ts and app/sitemap.ts compute their output from env and live data.
5. public queries are limited to published entries. Status: Implemented. Verification/fix: all public collection paths select status = published rows only.
6. large-catalog performance has no benchmark. Status: Open. Verification/fix: No performance benchmark or result-budget test exists for a large seeded catalog.
7. lazy loading or pagination is not yet proven. Status: Open. Verification/fix: No pagination or lazy-load strategy is in repo evidence.
8. search debouncing is not implemented. Status: Open. Verification/fix: No debounced or memoized search layer is documented.
9. asset optimization is not audited. Status: Open. Verification/fix: No image or asset optimization audit is present.
10. render performance is not benchmarked. Status: Open. Verification/fix: No React profiler or rendering budget is recorded in the repo.
11. cache strategy is not defined in repo. Status: External prerequisite. Verification/fix: A production cache strategy can be configured externally, but it is not specified in repo evidence.
12. health endpoint is absent. Status: Open. Verification/fix: No /health or operational endpoint is present.
13. anonymous preference retention is not finalized. Status: Open. Verification/fix: visitor preferences are stored in Supabase; no automatic expiration period is configured, and the Privacy and Cookies pages disclose that gap.
14. missing Supabase is tolerated gracefully. Status: Implemented. Verification/fix: lib/data.ts returns empty/fallback data when the DB client is unavailable instead of crashing.

## Reliability
1. build and typecheck scripts exist. Status: Implemented. Verification/fix: package.json includes build and typecheck scripts.
2. linting is configured. Status: Implemented. Verification/fix: package.json includes lint and ESLint configuration for the repo.
3. error boundaries exist. Status: Implemented. Verification/fix: app/error.tsx exists for route-level error handling.
4. not-found pages exist. Status: Implemented. Verification/fix: app/not-found.tsx exists.
5. loading states exist. Status: Implemented. Verification/fix: app/loading.tsx and app/agents/[slug]/loading.tsx exist.
6. stale pages are handled. Status: Implemented. Verification/fix: dynamic route settings avoid stale agent 404s and stale metadata issues.
7. missing Supabase is handled gracefully. Status: Implemented. Verification/fix: lib/data.ts checks for missing Supabase and returns safe data instead of throwing.
8. outages do not invent agent records. Status: Implemented. Verification/fix: README says the local fallback does not invent agent records.
9. data access errors are logged and downgraded. Status: Implemented. Verification/fix: lib/data.ts catches data errors and logs them while returning safe fallbacks.
10. admin writes fail closed. Status: Implemented. Verification/fix: admin routes reject unauthorized or invalid-CSRF requests with 401/403.
11. request validation is narrow and explicit. Status: Implemented. Verification/fix: clean() validates a whitelist of specific agent fields and types.
12. change history is preserved. Status: Implemented. Verification/fix: agent_change_audit stores before/after snapshots of edits.
13. production rate limiting is externalized. Status: External prerequisite. Verification/fix: README says process-local in-memory throttling is only an MVP and should be replaced in multi-instance production.
14. missing env values degrade gracefully. Status: Implemented. Verification/fix: app/layout.tsx and related routes default to localhost values when env values are absent.
15. report route requires external Lambda config. Status: External prerequisite. Verification/fix: README explicitly says app/api/report/route.ts fails until REPORT_LAMBDA_URL is configured.
16. freshness metadata is retained. Status: Implemented. Verification/fix: agent metadata stores metadata_last_checked_at, metadata_source, and metadata_is_stale.
17. public/admin separation is maintained. Status: Implemented. Verification/fix: admin tables remain separate from public policy access.
18. limitations are disclosed clearly. Status: Implemented. Verification/fix: README.md calls out the current MVP status and unverified catalog.
19. e2e reliability tests are absent. Status: Open. Verification/fix: No browser or end-to-end smoke suite is present in the repo.
20. admin auth regression tests are absent. Status: Open. Verification/fix: No admin login/CSRF regression test is present.
21. migration smoke tests are absent. Status: Open. Verification/fix: No SQL migration smoke test is in the repo.
22. restore/rollback plan is absent. Status: Open. Verification/fix: No backup/restore or rollback runbook is recorded.

## Admin operations
1. admin auth route exists. Status: Implemented. Verification/fix: app/api/admin/auth/route.ts handles login and logout behavior.
2. session creation logic exists. Status: Implemented. Verification/fix: createAdminSession() is called in the auth route to generate a signed admin session.
3. admin key must be configured externally. Status: External prerequisite. Verification/fix: app/api/admin/auth/route.ts reads process.env.ADMIN_DASHBOARD_KEY and cannot work without it.
4. admin dashboard page exists. Status: Implemented. Verification/fix: app/admin/page.tsx exists.
5. agent CRUD route exists. Status: Implemented. Verification/fix: app/api/admin/agents/route.ts implements GET, POST, and PATCH for agents.
6. verification admin endpoint exists. Status: Implemented. Verification/fix: app/api/admin/agents/verifications/route.ts exists in the repo.
7. audit snapshots are stored on changes. Status: Implemented. Verification/fix: agent_change_audit records previous_record and new_record JSON.
8. login success/failure is logged. Status: Implemented. Verification/fix: auditLogin() runs on each auth attempt and records success/failure.
9. login logs are stored in DB. Status: Implemented. Verification/fix: admin-security.sql defines admin_login_log and grants insert/select to service_role.
10. verification evidence is separated from public content. Status: Implemented. Verification/fix: hardening.sql states verification tables are admin-only with no public read/write policy.
11. origin validation and CSRF checks are enforced. Status: Implemented. Verification/fix: auth and admin mutation routes reject invalid origin and missing/invalid CSRF tokens.
12. cookies are short-lived and secure in production. Status: Implemented. Verification/fix: maxAge is 3600 and the secure flag is set when NODE_ENV is production.
13. verification grade is not user-editable from the public API. Status: Implemented. Verification/fix: admin update routes strip verification_score before persisting an agent change.
14. who changed data is stored. Status: Implemented. Verification/fix: agent_change_audit includes changed_by and app/api/admin/agents/route.ts populates it with admin.
15. invalid IDs are rejected. Status: Implemented. Verification/fix: PATCH validation enforces UUID format for incoming IDs.
16. archive state is supported. Status: Implemented. Verification/fix: agents retain legacy is_archived compatibility, while hardening.sql makes status values including archived and needs_review explicit and synchronizes archive state.
17. public admin tables are not exposed. Status: Implemented. Verification/fix: admin tables are protected by no public policy and service-role-only access rules.
18. retention policy is not defined. Status: Open. Verification/fix: No retention or archival lifecycle is defined for admin_login_log or audit tables.
19. health/ops anomaly tracking is absent. Status: Open. Verification/fix: There is no centralized admin anomaly dashboard or alerting pipeline in repo evidence.

## Testing
1. TypeScript compile check exists. Status: Implemented. Verification/fix: package.json includes a typecheck script using tsc --noEmit.
2. ESLint is configured. Status: Implemented. Verification/fix: eslint.config.mjs and package.json include ESLint for the repo.
3. production build exists. Status: Implemented. Verification/fix: package.json defines next build for a production build.
4. browser automation suite is absent. Status: Open. Verification/fix: No Playwright/Cypress/Vitest browser automation suite is present.
5. admin auth regression tests are absent. Status: Open. Verification/fix: No end-to-end admin auth or CSRF test is present.
6. verification trigger tests are absent. Status: Open. Verification/fix: No DB/sql tests cover sync_agent_verification_score().
7. migration smoke tests are absent. Status: Open. Verification/fix: No migration test harness or local Supabase validation pass is present.
8. empty-Supabase fallback tests are absent. Status: Open. Verification/fix: Fallback behavior exists but no automated test covers it.
9. a11y suite is absent. Status: Open. Verification/fix: No axe/Lighthouse or browser accessibility checks are configured.
10. security regression tests are absent. Status: Open. Verification/fix: No input-validation or security regression suite is visible in the repo.
11. rollback tests are absent. Status: Open. Verification/fix: No migration rollback or restore validation is documented.
12. content accuracy tests are absent. Status: Open. Verification/fix: The repo admits zero of 25 verification checks are complete; no fact-check suite exists.
13. clean() validator has no unit coverage. Status: Open. Verification/fix: No test coverage validates sanitized agent payloads against malicious data.
14. page snapshot tests are absent. Status: Open. Verification/fix: No route snapshot or visual regression suite is present.
15. production smoke build is external. Status: External prerequisite. Verification/fix: Build scripts exist, but production deployment validation is not captured in repo evidence.
16. report Lambda contract tests are absent. Status: External prerequisite. Verification/fix: The report route exists, but no Lambda contract test is stored in the repo.
17. startup env-failure tests are absent. Status: Open. Verification/fix: No smoke test verifies app behavior with missing env values.
18. QA runbook is absent. Status: Open. Verification/fix: No end-user QA or maintainer runbook is present in the repo.

## Deployment
1. Supabase vars are required for the catalog. Status: External prerequisite. Verification/fix: README says the app requires Supabase variables; without them it shows an empty directory.
2. NEXT_PUBLIC_SITE_URL is required. Status: External prerequisite. Verification/fix: app/layout.tsx, app/robots.ts, and app/sitemap.ts rely on NEXT_PUBLIC_SITE_URL for canonical URLs.
3. NEXT_PUBLIC_SUPABASE_URL and anon key are required. Status: External prerequisite. Verification/fix: README lists these env keys for the local setup.
4. ADMIN_DASHBOARD_KEY is required. Status: External prerequisite. Verification/fix: app/api/admin/auth/route.ts reads ADMIN_DASHBOARD_KEY for admin auth.
5. REPORT_LAMBDA_URL is required. Status: External prerequisite. Verification/fix: README says the report endpoint returns an error until REPORT_LAMBDA_URL is configured.
6. NEXT_PUBLIC_CONTACT_EMAIL is required. Status: External prerequisite. Verification/fix: README says the contact page uses NEXT_PUBLIC_CONTACT_EMAIL to open a local email draft.
7. TLS/certs are external to repo. Status: External prerequisite. Verification/fix: Cookie secure mode is conditional on production, but cert and TLS config are deployment-level concerns.
8. health checks or monitoring are absent. Status: Open. Verification/fix: No /health endpoint or operational monitoring config is present.
9. admin access depends on deployment-level defense layers. Status: External prerequisite. Verification/fix: App-level checks exist, but host-level WAF/CDN/IAM protections are still deployment work.
10. secrets stay out of source control. Status: Implemented. Verification/fix: README and .env.example direct env values to be managed outside source control.
11. migration order is documented. Status: Implemented. Verification/fix: README documents the recommended sequence: schema.sql, seed, audit, hardening, feature-migrations, admin-security.
12. all SQL files should not run indiscriminately. Status: Implemented. Verification/fix: README explicitly warns not to run every migration file without review.
13. admin security SQL is applied after the catalog setup. Status: Implemented. Verification/fix: README lists admin-security.sql after schema, seed, audit, and hardening steps.
14. env separation is documented. Status: Implemented. Verification/fix: README instructs copying .env.example to .env.local and filling in project values.
15. localhost defaults are intentionally non-production. Status: Implemented. Verification/fix: app/layout.tsx and app/sitemap.ts default to localhost only when env values are missing.
16. deployment runbook is missing. Status: Open. Verification/fix: No production runbook is recorded in repo evidence for deploy order, verification, or rollback.
17. monitoring and rollback plans are open. Status: Open. Verification/fix: No monitoring or rollback playbook is in the repo.

## Content governance
1. published entries are separate from verified entries. Status: Implemented. Verification/fix: README.md explicitly rejects the idea that published means verified.
2. invented or guessed details are rejected. Status: Implemented. Verification/fix: README.md prohibits guessed commands, ports, storage, hardware, and permission claims.
3. Catalog facts are reviewed against upstream documentation. Status: Implemented. Verification/fix: current catalog source references are preserved in supabase/CATALOG-SOURCES.md.
4. unknown fields are explicitly labeled as not reviewed. Status: Implemented. Verification/fix: normalizeAgent() uses review-status text instead of blank or vague values.
5. GitHub URLs are not treated as proof of local testing. Status: Implemented. Verification/fix: README.md says a repo URL or package name is not evidence of local installation or run success.
6. Imported catalog entries start unverified. Status: Implemented. Verification/fix: the current catalog migration initializes verification scores to zero.
7. metadata provenance is tracked. Status: Implemented. Verification/fix: hardening.sql adds metadata_source and metadata_last_checked_at to the agents table.
8. endorsement is disclaimed. Status: Implemented. Verification/fix: README.md and public docs say the directory is independent from listed projects and is not an endorsement engine.
9. verification rubric is defined. Status: Implemented. Verification/fix: README.md defines the five-item evidence checklist for verification.
10. score 5 requires real evidence. Status: Implemented. Verification/fix: README explicitly says verification_score = 5 cannot be derived from README review alone.
11. admin evidence is separate from public content. Status: Implemented. Verification/fix: verification and audit tables are administrative and have no public read/write policy.
12. users are told to review upstream docs. Status: Implemented. Verification/fix: README.md and page copy tell users to inspect upstream projects and decide if a tool fits their environment.
13. setup guidance is honest and limited to reviewed data. Status: Implemented. Verification/fix: README and schema docs say unsupported claims are removed and only reviewed details are retained.
14. editorial review workflow is missing. Status: Open. Verification/fix: No maintainer content-review checklist or editorial approval flow is present.
15. de-duplication and contradiction review are absent. Status: Open. Verification/fix: No process exists for duplicate or conflicting listing review.
16. freshness invalidation workflow is incomplete. Status: Open. Verification/fix: metadata_is_stale and metadata_last_checked_at provide a framework, but no operational job or enforced invalidation workflow is present.
17. moderation or approval workflow is absent. Status: Open. Verification/fix: No reviewer queue or moderation flow is recorded in the repo.
18. the app avoids claiming all entries are safe. Status: Implemented. Verification/fix: documentation clearly separates publication and verification from safety or endorsement.
19. verification evidence remains separate from public catalog data. Status: Implemented. Verification/fix: agent_verifications stores evidence in a separate table that feeds derived verification_score.
20. users are told when evidence is missing. Status: Implemented. Verification/fix: normalizeAgent() writes explicit not-reviewed wording for missing fields.
21. trust-sensitive claims require upstream validation. Status: Implemented. Verification/fix: docs consistently tell users to inspect upstream source and decide whether a project is appropriate for their environment.

## Deep repository audit — September 20, 2026

These findings came from tracing the current UI, API, data, and SQL paths and probing the running app. They are intentionally recorded separately from the 212-item checklist so future reviewers can see what was actually verified rather than infer completion from schema names.

1. **Superseded — admin catalog writes are not transactional.** The current agent create/update paths use transactional SQL RPCs that also write the change-audit row. See `supabase/agent-admin-rpcs.sql`.
2. **High — verification evidence and score writes are not transactional.** `app/api/admin/agents/verifications/route.ts` inserts evidence and then separately updates the agent score. A second-write failure leaves partial state.
3. **Superseded — analytics can return success without persistence.** The current API reports storage failure as a non-success response. Client-side event delivery remains best effort.
4. **Medium — database failures are mislabeled as invalid input.** Broad catches in the admin agent route collapse Supabase errors, missing migrations, constraints, and malformed input into the same 400 response.
5. **Superseded — feedback summary failures appear as zero votes.** The current API returns an explicit error response when the summary RPC fails.
6. **Superseded — feedback submission has an uncaught network-failure path.** `components/AgentFeedback.tsx` catches rejected requests, records a bounded API-error event, and renders an error state.
7. **Superseded — `source_click` is dead instrumentation.** `components/SourceLink.tsx` calls `trackEvent("source_click", { slug })`.
8. **Superseded — freshness metadata is schema-only.** The protected metadata route writes freshness fields, the admin dashboard can trigger refresh, and `vercel.json` declares the scheduled refresh. A separate stale-agent worklist is not present.
9. **Superseded — `trending_candidates` is schema-only.** A protected admin/cron ingestion route writes discovered candidates. A public moderation/approval/publishing workflow is still not documented as implemented.
10. **Medium — admin operations are incomplete.** There is no audit viewer, login-history viewer, stale-agent worklist, broken-link queue, analytics dashboard, category manager, catalog export, logout control, or Supabase Auth/MFA.
11. **Medium — verification evidence is one note per submission, not one note per checked item.** This is weaker than the intended evidence model and allows one generic note to support multiple checks.
12. **Medium — structured data overclaims operating-system support.** Agent pages always emit Windows, macOS, and Linux in `operatingSystem`, even when no commands are recorded for those systems.
13. **Medium — structured data equates no API key with free access.** `isAccessibleForFree` is derived from `requires_api_key`, which does not prove licensing or total cost.
14. **Low — category counts are capped featured counts.** The categories page uses a helper that slices to five, then labels the result as the category’s agent count.
15. **Low — report timeout cleanup is incomplete on rejected fetches.** The timeout is cleared only after successful fetch resolution rather than in `finally`.
16. **Low — fallback categories can mask a catalog outage.** Category labels remain visible when Supabase is unavailable while agent results are empty.
17. **Low — full-catalog related-agent queries will scale poorly.** Each agent detail request reloads the entire published catalog to rank three related entries.
18. **Superseded — no automated quality suite exists.** Unit/request tests and public-route smoke checks now exist. Browser, axe, Lighthouse, migration-integration, and authenticated end-to-end suites remain absent.
19. **External prerequisite — the live Supabase migration state is not proven by the repository.** Feature behavior depends on applying the SQL migrations in order.
20. **External prerequisite — deployment security is not proven locally.** TLS, distributed rate limiting, backups, monitoring, custom-domain metadata, and deployed header behavior require provider-level verification.

This September 20 deep audit is historical evidence, not a current readiness attestation. Several findings are superseded as marked above. The current repository reference and a fresh test/deployment review are required before making launch-readiness claims.

Summary at the time of that audit: AgentNine separated publication from verification, stored administrative evidence separately from public content, and warned users when details were unknown. LocalBusiness schema remains not applicable because this is not a local business directory. For the present implementation, remaining known gaps and local verification limits, see [`../product/PROJECT_REFERENCE.md`](../product/PROJECT_REFERENCE.md).
