# Website copy audit 001 follow-up

**Date:** 2026-10-05
**Scope:** Fixes approved for audit 001.

## Findings addressed

| Finding | Result |
| --- | --- |
| 1. Password handling | Privacy copy now says the browser form sends the password to Supabase Auth and that AgentHive application records do not store it. |
| 2. Freshness methodology | Trust logic now checks staleness before awarding the verified state. The methodology describes metadata-check time, commit-date fallback, the 180-day window, stale flags, and upstream changes. |
| 3. Comparison “Best fit” | Missing hardware data no longer adds a point. The label now describes recorded evidence and says it is not a recommendation for the visitor's setup. |
| 5. Missing verification dates | FAQ and homepage copy no longer promise a date on every listing. Listing metadata omits the review-date phrase when no date is recorded. |
| 6. Join email use | The form now matches the privacy notice and says the address is used to review and respond to the application. |
| 7. Join response promise | The page describes submission review without promising a personal reply. |
| 8. Local-model privacy | FAQ copy distinguishes local inference from possible network requests by tools or configuration. |
| 9. Missing listing details | Empty listing fields remain empty instead of receiving invented setup, issue-tracker, hardware, uninstall, first-run, or cost instructions. |
| 10. Account deletion | Confirmation now names saved agents, category follows, saved-agent history, and linked contribution submissions, with a contact-provider retention caveat. |
| 11. Catalog licensing claim | Site copy now describes source-linked AI-agent projects rather than asserting every listing is open-source. |
| 12. Endorsement implication | Search/social metadata no longer describes listed agents as “worth running.” |
| 13. Generic filler | Homepage contribution and signup text now describe the actual action or account feature. |
| 14. Error recovery copy | Not-found and generic error messages no longer assume every route is an agent listing. |

## Remaining launch blocker

Finding 4 is not resolvable from repository evidence alone. The Privacy and Terms pages still correctly say “Pre-launch review required.” Finalizing them requires the real operator identity, applicable jurisdictions, actual production providers and locations, retention settings, and qualified legal review. I did not invent those details or remove the warning.

Published database-backed agent/category content and upstream repository facts remain unverified because the database connection was unavailable. These changes do not create or alter a Supabase schema migration.

## Verification

- `npm run typecheck`: passed.
- ESLint on changed application, component, library, and test files: passed.
- `npm exec vitest run -- tests/compare.test.ts tests/trust.test.ts`: 2 files, 6 tests passed.
- The test runner integration did not discover paths on its first attempt; the repository's Vitest CLI was used directly and passed.
- `git diff --check`: passed.
- Browser check on the active local app showed the updated signup heading, account copy, and footer text.
- A repository search found no remaining audited “open-source,” “worth running,” or previously flagged fallback/filler phrases in `app/`, `components/`, and `lib/`.
- A production build and live database/deployment smoke test were not run. The app's dev server was active, so I avoided running a build that could interfere with its `.next` output.
