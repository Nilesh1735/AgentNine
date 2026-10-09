# AgentNine project and design reference

**Reviewed:** 2026-10-05
**Purpose:** A source-backed handoff for product/design research. This describes the implementation currently present in this repository, not the original build plan or unverified production configuration.

## How to read this document

- **Code fact** means the behavior or value is present in the named source file.
- **Local verification** means a command or local browser check was run against this checkout.
- **External state unknown** means it depends on the deployed host, Supabase project, vendor account, or an operation that was not independently queried.
- Contrast values below are calculated from the literal source sRGB color values with the WCAG relative-luminance formula. They are pair checks, not a claim that every rendered state or the whole website has passed an accessibility audit.

The application and component inventory was reviewed, key flows were traced in source, and representative home/search/legal routes were checked locally. The mobile visual sample was the home page at 390 x 844 CSS pixels. This is not a claim that every source line, browser, viewport, keyboard path, assistive technology, or external-service failure state has been manually exercised.

## Product and implementation

AgentNine is a source-linked directory of open-source AI-agent projects. Its central user task is to find a relevant project, inspect the upstream source and setup/access details, and decide whether to continue to the upstream repository. A listing's recorded verification is evidence from a point in time, not a safety certification or endorsement.

| Area | Current repository implementation |
|---|---|
| Web framework | Next.js 16 App Router, React 19, TypeScript |
| Styling | `app/globals.css`, Tailwind CSS v4 imports/utilities, CSS custom properties, responsive media queries |
| Search | Fuse.js client-side search over the fetched published catalog; query and filters are URL parameters |
| Database/auth | Supabase Postgres and Supabase Auth; public client for public reads, server-only service-role client for privileged server operations |
| Visitor preferences | Supabase-backed preferences keyed by a random HttpOnly visitor cookie; no `localStorage` or `sessionStorage` use was found under `app/`, `components/`, or `lib/` |
| Shared rate limiting | Upstash Redis REST when configured; local development/test fallback uses in-process memory; production fails closed when the shared limiter is unavailable |
| Agent metadata | Protected admin/cron endpoint and Vercel cron declaration in `vercel.json`; the actual hosting provider and deployed schedule were not independently verified |
| Contact/report integrations | Contact email uses `CONTACT_LAMBDA_URL` or Resend (`RESEND_API_KEY` and `CONTACT_FROM_EMAIL`); reports use `REPORT_LAMBDA_URL`; contact submissions are stored in Supabase when configured and can be linked to an authenticated account; broken-link reports are queued before external forwarding |
| Tests/checks | Vitest tests, typecheck, ESLint, UX/static checks, migration-manifest check, production configuration check, admin security check, build and route smoke script |

## Public pages and product surfaces

The App Router source contains the following page families:

| Route | Purpose |
|---|---|
| `/` | Home, visual directory intro, preview, categories, recently updated projects, trust/FAQ and contribution invitation |
| `/search` | Search and filters for the published catalog |
| `/categories`, `/categories/[slug]` | Category index and filtered category detail |
| `/agents/[slug]` | Project detail, setup and access information, source links, feedback, verification and related-agent content |
| `/compare` | Compare selected agents |
| `/faq`, `/methodology` | Help and verification methodology |
| `/about`, `/join`, `/contact` | Project and contribution/contact surfaces |
| `/login`, `/signup`, `/forgot-password`, `/reset-password` | Supabase account/auth flows |
| `/account`, `/profile`, `/account/delete` | Account and saved-agent surfaces |
| `/admin` | Shared-key admin dashboard |
| `/privacy`, `/cookies`, `/terms`, `/refunds` | Legal and preference information |
| `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/icon.svg` | Discovery and site metadata routes/assets |

API route families include anonymous preferences, analytics, feedback, contact submissions, broken-link reports, account deletion, admin authentication, agent CRUD/metadata/verification, and trending-candidate submission. The repository contains loading/error UI for major route families. Route smoke checks validate a fixed set of public routes; they do not prove every dynamic slug or authenticated integration.

## Visual identity: exact source values

The authoritative CSS token definitions are in `app/globals.css`. Variable names such as `--blue` and `--blue-text` are historical names: the light-theme value is red, not blue.

### Light theme

| Role in current CSS | Token/value |
|---|---|
| Main text (`--ink`) | `#17181A` |
| Supporting text (`--muted`) | `#62666D` |
| Subtle labels (`--subtle`) | `#686C73` |
| Page, panel, surface, form field | `#FFFFFF` |
| Soft surface | `#FAFAFA` |
| Skeleton surface | `#ECEEF0` |
| Soft accent, feedback selection and CTA surface | `#FFF0EF` |
| Brand/action red (`--blue`, `--blue-text`, `--focus-ring`, selection background) | `#DD0200` |
| Darker red hover (`--blue-dark`) | `#A60000` |
| Pale red (`--blue-pale`) | `#FFD6D5` |
| Warm/footer/code surface | `#F6F7F9` |
| Primary button | `#111318` with `#F1F2F4` text |
| Code text | `#1F2937` |
| Error/destructive surface (`--error`) | `#FF6D1F` |
| Error text (`--error-text`) | `#A60000` |
| Text on error surface (`--on-error`) | `#17181A` |
| CTA border | `#F0C5C4` |
| Border/separator (`--line`) | `#E2E4E7` |

### Dark theme

| Role in current CSS | Token/value |
|---|---|
| Main text (`--ink`) | `#F1F2F4` |
| Supporting text (`--muted`) | `#A5A8AF` |
| Subtle labels (`--subtle`) | `#A5B0C0` |
| Page, hero, warm and footer surfaces | `#000000` |
| Panel and general surface | `#181818` |
| Form field | `#0E0F11` |
| Soft accent | `#2A1919` |
| Skeleton surface | `#2B2D30` |
| Brand/action red (`--blue`) | `#DD0200` |
| Brand text red (`--blue-text`) | `#FF7772` |
| Darker red hover (`--blue-dark`) | `#A60000` |
| Pale red (`--blue-pale`) | `#FFD6D5` |
| Error text (`--error-text`) | `#FF7772` |
| Text on error surface (`--on-error`) | `#17181A` |
| Primary button | `#111318` with `#F1F2F4` text |
| CTA surface/text/muted | `#241515` / `#F1F2F4` / `#B9C4D8` |
| Code surface/text/muted | `#111820` / `#DBE7F7` / `#A5B0C0` |
| Border/separator | `rgba(255, 255, 255, 0.14)` |
| Feedback selection | `#351B1B` |

The same stylesheet also defines neutral `oklch()` shadcn/Tailwind-compatible tokens (`--background`, `--foreground`, `--primary`, `--border`, chart and sidebar tokens). These coexist with the AgentNine semantic tokens above. They are not a second brand palette.

### Search field background

`.search-input-wrap` uses the `--field` token for its base background and has an explicit dark-theme override to `--surface`. This keeps the search field dark in dark mode rather than compositing a pale hard-coded background onto the panel.

### Other visual values and layout

- Root body text is 16px with 1.5 line-height; global inputs use 16px. The shared scale defines named sizes at 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 22, and 24px (at the root 16px size). Common small and body-text declarations use these tokens. Responsive display sizes and component-specific exceptions remain.
- Global `h1`/`h2` use a serif stack at weight 500 with `-0.025em` tracking, although page/component rules often override size, spacing, or family.
- Shared container maximum width is 1160px. At widths up to 800px it is constrained to the viewport with 16px side margins and a 620px maximum.
- Radius values are now defined in named tokens for tight controls, menus, panels, cards, toolbars, pills, and compact indicators. Remaining circular shapes use percentage radii for geometry.
- Responsive viewport breakpoints use 480px, 640px, 800px, and 1120px; overlapping route/component rules still exist, but those rules now align to the shared thresholds.
- The homepage has an animated grayscale/liquid WebGL visual, a circular agent mark with a red segment, and the display phrase “SEARCH. VERIFY. RUN.” The page now also exposes a semantic H1 to assistive technology; the artwork remains decorative. A local 390px screenshot confirmed the composition on that viewport. `prefers-reduced-motion` handling exists in global CSS.
- The hero background now synchronizes from the document's `data-theme` before paint and observes theme changes. Previously it started with a hard-coded light state and synchronized only after render, so route return/theme changes could briefly show a mismatched layer. The WebGL background-only mode also had no visible artwork when context initialization failed or the context was lost; it now falls back to theme-aware CSS gradients. Local browser checks verified route-return theme consistency and the fallback layer after forcing WebGL context loss.

## Typography

| Usage | Actual source family | Notes |
|---|---|---|
| General UI/body | Geist via `next/font/google`, exposed as `--font-geist-sans`; fallback `"Segoe UI", sans-serif` | Root body is 16px/1.5. The exact loaded webfont is determined by the package/build output and font subset configuration in `app/layout.tsx`. |
| `h1`/`h2` default | Georgia, then Times New Roman, serif | CSS default is weight 500 and `-0.025em` tracking; many page-level styles override it. |
| Commands/code/keyboard keys | Geist Mono via `next/font/google`, exposed as `--font-geist-mono`; fallback `monospace` | Used by `pre`, `code`, `kbd`, and explicit metadata styles. |
| Hero visual label text | Locally bundled “ThreeUI Fragment Mono” (`fragment-mono.woff2`) | Declared in the gallery heading stylesheet and used for small uppercase/microcopy in that visual. |
| Hero display headline | `Didot`, `Bodoni 72`, `Times New Roman`, serif | This is the fallback stack in `GalleryHeadingVisual.tsx`'s embedded visual, separate from the regular page `h1` rule. |
| Embedded ThreeUI UI text | `"Geist", "Helvetica Neue", Helvetica, Arial, sans-serif` | Declared in the bundled ThreeUI stylesheet. The main app's `next/font` class is on the outer document; an embedded iframe has its own document and font CSS. |

The shared scale does not replace the existing font families or the bespoke hero display type. The “SEARCH. VERIFY. RUN.” font was not changed. Many responsive display headings intentionally use `clamp()` and there are still route-level typographic overrides; this is a size-token system, not a typography-family redesign. Readability and text scaling have not been verified through a full page-by-page accessibility run.

## Contrast spot-checks

Computed from the source hex colors using WCAG relative luminance:

| Foreground on background | Ratio | Interpretation |
|---|---:|---|
| Light `--ink #17181A` on white | 17.77:1 | Passes WCAG AA normal-text ratio |
| Light `--muted #62666D` on white | 5.77:1 | Passes AA normal-text ratio |
| Light `--subtle #686C73` on white | 5.27:1 | Passes AA normal-text ratio |
| Light `--subtle #686C73` on skeleton gray `#ECEEF0` | 4.53:1 | Passes AA normal-text ratio for this tested pairing |
| Light brand red `#DD0200` on white | 5.14:1 | Passes AA normal-text ratio |
| Dark text `#17181A` on destructive orange `#FF6D1F` | 6.31:1 | Passes AA normal-text ratio; `.button-danger` uses this pairing |
| Light error text `#A60000` on white | 8.01:1 | Passes AA normal-text ratio |
| Dark `--ink #F1F2F4` on black | 18.75:1 | Passes AA normal-text ratio |
| Dark `--muted #A5A8AF` on black | 8.82:1 | Passes AA normal-text ratio |
| Dark `--muted #A5A8AF` on panel `#181818` | 7.46:1 | Passes AA normal-text ratio |
| Dark brand text `#FF7772` on panel `#181818` | 6.88:1 | Passes AA normal-text ratio |
| Red focus ring `#DD0200` against black | 4.08:1 | Exceeds the 3:1 non-text contrast threshold for this tested pairing |

These are targeted pair checks, not a claim that every rendered state or the whole website passes WCAG AA. Verify any new colors against their actual backgrounds in both themes.

## Component inventory by role

The `components/` tree contains shared route, admin, account, effects, and UI components. The unused `TeamRevealGrid` and `SharedTooltipAvatars` files were removed; the admin operations panel is now a separate component.

| Role | Components observed in source |
|---|---|
| Global navigation/utilities | `Header`, `Footer`, `SiteUtilities`, `ThemeToggle`, `ConsentBanner`, `ConsentPreferencesButton` |
| Home/discovery | `DirectoryPreview`, `CatalogBackground`, `GalleryHeadingVisual`, `AgentOrbit`, `AgentCard`, `CategoryNav`, `CatalogState`, `HomeLoadingSkeleton` |
| Search/compare/save | `SearchBox`, `CompareButton`, `SavedAgentButton`, `AgentAnalytics`, `AgentFeedback` |
| Listing/setup/trust | `SetupStepper`, `SourceLink`, `ReportBrokenLink`, `VerificationSummary` |
| Authentication/account | `AuthForm`, `AuthPageShell`, `RecoveryForm`, `AccountDashboard`, `ProfileDetails`, `ProfileCardSkeleton`, `ProfileAvatars`, `DeleteAccountForm` |
| Admin/forms/feedback | `AdminDashboard`, `AdminOperations`, `JoinForm`, `ConfirmDialog`, `FaqDirectory` |
| Loading/UI/effects | `RouteLoadingSkeleton`, `SearchContentSkeleton`, `RectangleButtons`, `button`, WebGL error boundary/liquid component, gallery heading shader effects |

This list groups components by current filenames and use; it is not a guarantee that every component has independent automated behavior coverage.

## Data and privacy behavior traced in source

- Public catalog reads select published `agents` and categories through the Supabase public server client. The data helpers use a 60-second Next.js cache; admin catalog updates invalidate the catalog tags. Related-agent reads use the bounded `get_related_agents` RPC after migration 023; only its explicit compatibility fallback ranks the cached full catalog.
- Search uses the already-loaded catalog client-side, with Fuse keys for name, description, tags, repository URL, category and capability/access-related text. Supported URL filter parameters include query `q`, category, OS, API-key requirement, verification, updated recency, and sort. Search text remains a URL query for shareable search; it is not intended to be placed in analytics events.
- Recent agent names, compare selection, setup progress, theme, analytics consent/session, and campaign attribution are stored in visitor preferences on Supabase, keyed by the HttpOnly visitor cookie. Recent activity is associated with that cookie, not shared between all visitors.
- Analytics has an application allowlist of ten event names. The server requires persisted consent, validates event/property shapes and rate limits requests. It returns an error status when the database write fails rather than returning success for a failed insert.
- Feedback votes are stored and the API returns an explicit unavailable/error status when it cannot obtain a summary.
- Contact submissions are validated and rate limited; signed-in submissions carry a verified bearer token and are linked to the Auth user only when the submitted email matches. The route writes through the service-role client before forwarding to the configured contact endpoint. Live end-to-end delivery has not been tested.
- Broken-link reports are stored in `broken_link_reports` before optional external forwarding. A failed or missing forwarding endpoint leaves the report queued; admin status changes support in-review, resolved, and ignored.
- The protected admin operations endpoint serves changed-field audit history, login outcomes without IP addresses, stale published listings, unresolved broken-link reports, and daily aggregate event counts. The analytics view does not return event properties.
- Admin catalog create/update calls transactional SQL RPCs that write change-audit records in the same function. After migration 022, an individual verification insert synchronizes the score, date, commit, operating systems, setup evidence, failure conditions, and notes within the same database transaction. Bulk entries retain the existing score/date behavior and do not rewrite those per-agent setup fields.
- Migration 022 changes account-owned contribution submissions to cascade on Auth-user deletion. Migration 023 also purges linked and legacy exact-email submissions before Auth deletion; the deletion endpoint fails closed if that purge RPC fails. Anonymous feedback/analytics and admin security-log rows are not account-linked and remain subject to their separately configured retention policy.
- Admin login uses the shared `ADMIN_DASHBOARD_KEY`, HMAC-signed HttpOnly session cookie, CSRF token, same-origin checks, and a database-backed session-revocation lookup. It does not provide named admin identities or MFA.

## Readiness findings and recommended order

### Prelaunch status, 2026-10-06

These are evidence-based engineering estimates, not guarantees. “Enter prelaunch”
means private validation can proceed; it does not mean public launch is approved.

| Area | Score / 10 | Evidence and remaining gap |
|---|---:|---|
| Repository automated health | 8 | 57 tests, typecheck, lint, UX/anti-vibe, migration manifest, 12 admin-boundary checks, and 14-route smoke checks pass. A fresh build was not run in this review. |
| Supabase schema/security posture | 6.5 | User-shared screenshots show migration 029 indexes, 15 state/privilege/RLS checks, and expected policies passing. Catalog count and broader table/function/constraint checks remain. |
| Authenticated app workflows | 4 | Admin key form and signed-out account prompt render locally. Authenticated admin CRUD and two-user saved-agent isolation remain untested. |
| Production configuration/integrations | 2 | Local production-config validation fails: site URL is not an accepted HTTPS origin, contact endpoint and both Upstash settings are absent, and trusted-proxy configuration is unset. Production-host state is unknown. |
| Hosting/domain/SEO | 1.5 | Current DNS/deployment/HTTPS has not been verified; the earlier parked-domain result is historical. |
| Operations/recovery | 2 | Backup/PITR confirmation, restore rehearsal, monitoring/alerts, and incident/rollback ownership were not evidenced. |
| Accessibility/legal/privacy operations | 4 | Static checks pass; manual keyboard/screen-reader audit, legal operator/jurisdiction review, retention periods, and complete deletion/retention operations remain. |
| Release traceability | 3 | The worktree contains extensive modified, deleted, and untracked files. This review did not clean, stage, or commit them; intended release contents need owner review. |

On 2026-10-06, all 57 Vitest tests, TypeScript, ESLint, UX and anti-vibe
checks, migration-manifest check, admin security-boundary check, and route
smoke check passed. The production-config check was explicitly run against
local `.env.local` without printing values and failed on the missing/invalid
items above. User-shared Supabase screenshots provide useful evidence but are
not an independent database connection. Authenticated flows, production
services, hosting, backup/restore, and alerts remain owner-verification tasks.

**Verified repository-side preparation:** shared rate-limit responses include retry/quota headers; migration 029 contains the two unique indexes and screenshots show them present; automated tests, type/lint/static checks, admin-boundary checks, and route smoke checks pass as recorded above.

**Still required before public launch:**

1. **Authenticated behavior:** use the dashboard key locally to test admin list/create/edit/reload/sign-out; use two normal confirmed accounts to test saved-agent add/remove and user isolation. Do not use a service-role key for user-isolation validation.
2. **Database completeness:** verify the intended 71 published catalog records and remaining table/function/request-type-constraint checks. Screenshots show selected RLS, policy, privilege, and state checks only; they do not establish all database contents or the applied migration history.
3. **Production environment and providers:** the local `.env.local` production-config check fails on contact forwarding, both Upstash settings, the accepted HTTPS site-origin requirement, and trusted proxy configuration. Configure and verify these in the actual deployment environment. Set trusted-proxy handling only after confirming the hosting proxy sanitizes forwarding headers.
4. **Hosting and domain:** recheck apex/`www`, deployment target, HTTPS redirects, HSTS, CSP, canonical URL, production cookies, source-map exposure, and scheduled metadata refresh on the deployed service. The earlier parked-domain result is historical, not a current DNS measurement.
5. **Operations and recovery:** confirm Supabase backup/PITR, conduct a restore rehearsal in a non-production project, set uptime/5xx/provider alerts, and identify the person responsible for response and rollback.
6. **Accessibility and legal/privacy:** complete keyboard and screen-reader review; have the owner/counsel finalize operator identity, jurisdiction, terms/privacy wording, retention periods, and deletion processes.
7. **Release traceability:** review and explicitly select the intended changes from the current broad dirty worktree before creating a release commit. No files were staged or committed in this review.

The repository cannot independently establish the current live catalog's verified count or whether a human personally tested each listing. A recorded checklist score is not a safety certification.

### Color/font facts for research

Use the palette and font tables above as the transcription of the current source. The display style is a deliberate mix: Geist UI, Georgia editorial headings, and a bespoke serif/monospaced hero visual. This document does not assert those are the final brand decisions; it records what is implemented. [`DESIGN_RULES.md`](../design/DESIGN_RULES.md) is the design intent/rules document, while this file is the current implementation reference where they differ.

## Prior verification, 2026-09-29

Local checks run on this worktree on 2026-09-29:

- `npm test`: 28 tests across 5 test files passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with no warnings.
- `npm run build`: passed on Next.js 16.3.5.
- `npm run check:routes`: source checks and 14 production-route HTTP smoke checks passed.
- `npm run check:migrations`: passed; 24 sequential manifest entries match the SQL files. This is a repository consistency check only.
- `npm run check:admin-security`: 12 unauthenticated/wrong-origin boundary cases passed. These are intentional security denials, not evidence of a failed valid admin sign-in.
- `npm run check:ux` and `npm run check:anti-vibe`: passed.
- `npm run check:production-config`: skipped because `CHECK_PRODUCTION_CONFIG=1` was not set.
- A local production browser session rendered the homepage, semantic H1, catalog preview, and concise consent labels. Browser click-through verified dark theme, SPA navigation to search, a dark `#181818` search surface, return to the homepage with its dark catalog background intact, a switch back to light, and a theme-aware CSS fallback after WebGL context loss. The local production-mode server logged that Upstash URL/token were not configured, so the fail-closed rate limiter returned HTTP 503 before visitor-preference persistence could be tested. The updated toggle changed the current visit and announced that its preference was not saved. Consent and theme persistence remain unverified; this is not a production-service check.
- Earlier warmed loopback measurements reported medians of 14ms for `/`, 33ms for `/search`, 27ms for `/agents/qwen-code`, 5ms for `/cookies`, and 6ms for `/terms`. These values were not remeasured in this validation pass, are not deployed-user latency measurements, and do not represent cold database paths.
- A prior browser sample inspected the homepage at 390 x 844 and the search page. That sample did not exercise every browser, viewport, keyboard path, assistive technology, or authenticated flow.

## Readiness verification, updated 2026-10-06

- After the source-comment cleanup, `npm run build`, `npm run typecheck`, `npm run lint`, and all 51 Vitest tests across 12 files passed.
- `npm run check:ux`, `npm run check:anti-vibe` (105 public TSX files), `npm run check:migrations` (25 ordered files, IDs 001-028 with 003-005 retired), `npm run check:routes` (17 source checks and 14 live routes), and `npm run check:admin-security` (12 boundary checks) passed. `git diff --check` passed.
- Before deployment, shared rate-limit responses now include retry/quota headers, and migration 029 adds database-level uniqueness for active source submissions and trending-candidate URLs. User-shared Supabase SQL Editor screenshots on 2026-10-05 show both migration 029 indexes present.
- Removed 180 ordinary comments from 13 first-party source/configuration files. Kept executable directives, public API deprecation tags, generated Next declarations, and third-party attribution/license notices. This cleanup was build-, type-, lint-, and test-validated.
- The local `/join` page rendered AgentNine branding and working form controls in the earlier browser check. No join request was submitted.
- Earlier review found the public apex and `www` domains serving a parked-domain page, not AgentNine. This is historical evidence and must be rechecked before launch.
- On 2026-10-06, a presence-only check of `.env.local` found the required Supabase, admin, site URL, contact email, and cron variable names populated locally, but `CONTACT_LAMBDA_URL`, both Upstash credentials, and `TRUSTED_PROXY_HEADERS` blank. Presence is not validity, and local values do not establish production-host configuration.
- User-shared Supabase SQL Editor screenshots on 2026-10-05 show migration 029's two unique indexes, all 15 displayed agent/candidate state, privilege, and RLS checks passing, and the expected five catalog/saved-agent policies. This is user-provided evidence, not an independent connection. The 71-entry catalog count and broader table/function/constraint checks remain unverified.
- On 2026-10-06, `npm test` passed (57 tests across 14 files), `npm run typecheck`, `npm run lint`, `npm run check:ux`, `npm run check:anti-vibe` (105 public TSX files), and `npm run check:migrations` passed. `npm run check:admin-security` passed 12 boundary cases; `npm run check:routes` passed 17 source checks and 14 live routes. `git diff --check` passed. A fresh production build was not run in this review.
- These checks do not constitute a full browser, accessibility, authenticated-flow, external-service, or independent live-database audit. Authenticated admin CRUD and two-user saved-agent isolation are still untested; live production services and hosting are unknown.

## External state not verified by repository checks

- Whether all reported migrations are present in the intended Supabase project. Screenshots show selected checks and migration 029 indexes, but not the full migration history or catalog count.
- Whether local Supabase credentials target the intended project; compare the project reference in the Supabase dashboard before applying migrations.
- Whether production environment variables match `.env.example`; secret values must not be pasted into this document or chat.
- Whether the exposed local admin secret was also present in the deployed environment. The local file was rotated earlier; production secret rotation remains an operator action and can only be confirmed in the host's secret manager or restricted deployment log.
- The old GitHub token is still identified as requiring revocation in `supabase/DEPLOYMENT-CHECKPOINT.md`; revoke it in GitHub and replace it in both local and production secret stores before metadata refresh or repository discovery uses it.
- Whether either supported contact-delivery path, `REPORT_LAMBDA_URL`, Upstash, Supabase Auth providers, and scheduled jobs are deployed, restricted, and responding. Local contact/Upstash/proxy variables are blank; production-host state is unknown.
- Whether the deployed domain enforces HTTPS redirect/HSTS, and whether production cookies, CSP, canonical metadata, analytics, email/contact delivery, backups, monitoring/alerts, restore procedures, and data retention are configured.
- The legal operator identity, jurisdiction, and retention periods remain owner/counsel decisions; the app does not automatically delete every anonymous or admin record.

## Source-of-truth files

- Design tokens and global typography: `app/globals.css`
- Font loading and document shell: `app/layout.tsx`
- Hero display visual: `components/GalleryHeadingVisual.tsx`, `components/CatalogBackground.tsx`, and `components/effects/gallery-heading/src/shaders/threeui.css`
- Search behavior: `app/search/page.tsx` and `components/SearchBox.tsx`
- Data access/caching: `lib/data.ts`
- Visitor preferences: `app/api/preferences/route.ts`, `lib/visitor-preferences.ts`, and `supabase/020-visitor-preferences.sql`
- Analytics allowlist/persistence: `app/api/analytics/route.ts`, `lib/analytics.ts`, and `supabase/021-analytics-event-names.sql`
- Database application order: `supabase/MIGRATIONS.md`
- Setup/release operations: `README.md`
- Security boundaries: `SECURITY.md`
