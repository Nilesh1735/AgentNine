# Fresh Supabase project checkpoint

This is the per-project record for the new AgentNine Supabase project. Update
the status and result only after the corresponding SQL finishes successfully in
the Supabase SQL Editor. Save a copy of this file with your deployment records.

Do not put project passwords, database URLs, API keys, service-role keys, or
other secrets in this checkpoint.

## Project record

- Project nickname: not recorded
- Supabase project reference: not recorded
- Deployment environment: fresh project
- Started/completed: 2026-10-03 (user-reported)
- Last completed SQL file: `032-complete-os-coverage.sql` (032, user-reported as run on 2026-10-08; the live AgentNine pages reflect the new DB-GPT and Crush guide data)
- Next SQL file: none currently pending
- Current result: Migrations through 032 are user-reported as run. Earlier read-only live checks confirmed 71 published agents, all 137 supported operating-system panels have an install command or official installer link, and all 71 agents have at least one supported install route. There are 66 agents with shell commands; five desktop agents rely on official installer links. The four documented uninstall-command panels remain present. After migration 032, the live DB-GPT page showed the explicit unknown Windows route and retained its macOS/Linux install commands; after a page reload, the Crush macOS panel displayed the Homebrew install command. The standard `supabase_migrations.schema_migrations` ledger and any application-specific migration ledger are absent; this checkpoint is the migration execution record.
- Completion report received: 2026-10-07 01:21 IST. Exact SQL Editor execution time was not provided.
- Environment secret update: local admin and cron secrets were rotated on 2026-10-05; production values remain a separate update, and the old `GITHUB_TOKEN` must be revoked/replaced before GitHub metadata refresh or repository discovery uses it

## Before running SQL

- [x] Create the new Supabase project.
- [x] Enable Google in Supabase Auth, configure its provider credentials and redirect allowlists, and test local OAuth sign-in (user-confirmed working on 2026-10-06). App callback implementation is present at `/auth/callback`; production OAuth remains untested until deployment.
- [x] Rotate local `ADMIN_DASHBOARD_KEY` and `CRON_SECRET` on 2026-10-05; values are not recorded here. Update the deployment host separately.
- [ ] Revoke the old GitHub token and create a replacement. Do not share either token in chat or commit it.
- [ ] Update `GITHUB_TOKEN` in local environment and deployment secrets, then redeploy/restart so the running app receives the replacement.
- [ ] Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only.
- [x] Use `MIGRATIONS.md` and this checkpoint to follow the SQL order.

## Migration log

The user reports that migrations through 026 were run in order on 2026-10-03,
and that all active files through 028 were run by 2026-10-05 at 18:10 IST.
On 2026-10-05 at 23:51 IST, the user shared a screenshot of the Supabase SQL
Editor result for the migration 029 index verification query, showing both
expected indexes. This is user-reported evidence, not a direct connection to
the database. If any migration did not succeed, correct its row before relying
on this checkpoint. For future migrations, run one file at a time and record
its exact result. If a file fails, record `FAILED`, redact secrets from the
error, and stop until the failure has been reviewed.

| ID | SQL file | Status | Run date/time | Result or safe error summary |
| --- | --- | --- | --- | --- |
| 001 | `schema.sql` | DONE (user-reported) | 2026-10-03; exact time not provided | Reported run in recommended order |
| 002 | `add-setup-fields.sql` | DONE (user-reported) | 2026-10-03; exact time not provided | Reported run in recommended order |
| 003 | Retired legacy 25-agent import | RETIRED (not run) | N/A | Removed from the supported migration set; ID preserved |
| 004 | Retired legacy 50-agent import | RETIRED (not run) | N/A | Removed from the supported migration set; ID preserved |
| 005 | Retired legacy seed correction | RETIRED (not run) | N/A | Removed with its obsolete seed imports; ID preserved |
| 006 | `hardening.sql` | DONE (user-reported) | 2026-10-03; exact time not provided | Reported run in recommended order |
| 007 | `verification-source-commit.sql` | DONE (user-reported) | 2026-10-03; exact time not provided | Reported run in recommended order |
| 008 | `agent-concurrency.sql` | DONE (user-reported) | 2026-10-03; exact time not provided | Reported run in recommended order |
| 009 | `database-hardening.sql` | DONE (user-reported) | 2026-10-03; exact time not provided | Reported run in recommended order |
| 010 | `source-integrity.sql` | DONE (user-reported) | 2026-10-03; exact time not provided | Reported run in recommended order |
| 011 | `metadata-integrity.sql` | DONE (user-reported) | 2026-10-03; exact time not provided | Reported run in recommended order |
| 012 | `candidate-moderation.sql` | DONE (user-reported) | 2026-10-03; exact time not provided | Reported run in recommended order |
| 013 | `admin-security.sql` | DONE (user-reported) | 2026-10-03; exact time not provided | Reported run in recommended order |
| 014 | `admin-session-revocation.sql` | DONE (user-reported) | 2026-10-03; exact time not provided | Reported run in recommended order |
| 015 | `agent-admin-rpcs.sql` | DONE (user-reported) | 2026-10-03; exact time not provided | Reported run in recommended order |
| 016 | `feature-migrations.sql` | DONE (user-reported) | 2026-10-03; exact time not provided | Reported run in recommended order |
| 017 | `account-features.sql` | DONE (user-reported) | 2026-10-03; exact time not provided | Includes authenticated saved-agent table grants |
| 018 | `category-copy-cleanup.sql` | DONE (user-reported) | 2026-10-03; exact time not provided | Reported run in recommended order |
| 019 | `launch-readiness.sql` | DONE (user-reported) | 2026-10-03; exact time not provided | Reported run in recommended order |
| 020 | `020-visitor-preferences.sql` | DONE (user-reported) | 2026-10-03; exact time not provided | Reported run in recommended order |
| 021 | `021-analytics-event-names.sql` | DONE (user-reported) | 2026-10-03; exact time not provided | Reported run in recommended order |
| 022 | `022-verification-atomicity-and-user-deletion.sql` | DONE (user-reported) | 2026-10-03; exact time not provided | Reported run in recommended order |
| 023 | `023-admin-operations-and-related-agents.sql` | DONE (user-reported) | 2026-10-03; exact time not provided | Reported run in recommended order |
| 024 | `join-requests.sql` | DONE (user-reported) | 2026-10-03; exact time not provided | Reported run in recommended order |
| 025 | `025-public-catalog-grants.sql` | DONE (user-reported) | 2026-10-03; exact time not provided | Includes service-role catalog SELECT/UPDATE grants |
| 026 | `026-agenthive-71-project-catalog.sql` | DONE (user-reported) | 2026-10-03; exact time not provided | Reported run in recommended order |
| 027 | `027-contribution-submission-service-only.sql` | DONE (user-reported) | Reported complete by 2026-10-05 18:10 IST; exact run time not provided | Restricts contribution-submission table access to the server-side service role |
| 028 | `028-state-columns-not-null.sql` | DONE (user-reported) | Reported complete by 2026-10-05 18:10 IST; exact run time not provided | Backfills and constrains agent/archive/candidate states |
| 029 | `029-concurrent-submission-deduplication.sql` | DONE (user-reported; indexes verified) | Reported complete by 2026-10-05 23:51 IST; exact SQL execution time not provided | Supabase SQL Editor screenshot shows both `contribution_submissions_active_source_url_uidx` and `trending_candidates_source_url_uidx` |
| 030 | `030-evidence-based-setup-guides.sql` | DONE (user-reported; app response checked) | Reported run 2026-10-07; exact time not provided | Adds `agents.setup_guide`, preserves admin-authored guides, seeds README references and only explicit OS-specific install/uninstall commands for all 71 catalog agents, and replaces the admin create/update RPCs to persist the field |
| 031 | `031-complete-setup-install-routes.sql` | DONE (user-reported; live data verified) | 2026-10-07; exact SQL execution time not provided | Adds verified commands and official installer download links for gaps found in the 2026-10-07 deep audit; preserves non-empty platform commands. Live query confirms no supported platform is missing an install route. |
| 032 | `032-complete-os-coverage.sql` | DONE (user-reported; app pages verified) | 2026-10-08; exact run time not provided | Adds explicit unknown states for unverified OS entries, verified Gemini CLI/Crush/ComfyUI routes, and a Windows-specific command-code launcher correction. Live DB-GPT page reflects the Windows unknown state and retains macOS/Linux commands; live Crush page shows the macOS Homebrew command after reload. |

## Verification checkpoint

Run these checks after migration 029 succeeds. Record the date and outcome.

### Database checks

- [x] The `MIGRATIONS.md` post-migration queries show the expected tables and functions (user-shared SQL Editor results, 2026-10-06).
- [x] Expected service-role and saved-agent privileges return `true`; anonymous and authenticated contribution-submission insert privileges return `false` (user-shared SQL Editor screenshots, 2026-10-05).
- [x] The contribution request-type constraint includes `join-request` (user-shared SQL Editor result, 2026-10-06).
- [x] RLS is enabled for the catalog and saved-agent tables; expected published-agent, category, and per-user saved-agent policies were shown (user-shared SQL Editor screenshots, 2026-10-05).
- [x] Agent publication/archive states and trending-candidate status are non-null and consistent (zero invalid-state rows shown in user-shared SQL Editor screenshot, 2026-10-05).
- [x] Migration 029's active-submission and candidate-source unique indexes are present (user-shared SQL Editor screenshot, 2026-10-05 23:51 IST).
- [x] RLS is enabled on `agents`, `categories`, and `saved_agents`; the published-agent and per-user saved-agent policies are present (user-shared SQL Editor screenshots, 2026-10-05).
- [x] The published catalog contains the intended 71 roster entries, with 9 Automation, 25 Coding, 6 Research, and 31 Content entries (catalog integrity checked; user reports publishing the remaining nine entries, 2026-10-06).

Verification run date/time: 2026-10-05 23:51 IST (index query); 2026-10-05 23:59 IST (state, privilege, and RLS checks); 2026-10-06 (tables, functions, constraints, policies, catalog, app grants, and elevated-grant cleanup; user-shared SQL results).  
Result: expected schema objects, functions, constraints, indexes, RLS policies, catalog integrity, and application grants were confirmed from user-shared results. The required app permissions remain present; contribution inserts remain denied to `anon` and `authenticated`. Elevated `MAINTAIN`, `TRUNCATE`, `REFERENCES`, and `TRIGGER` direct grants were revoked; the follow-up audit returned no rows. User reports all nine formerly `needs_review` agents are now published. The migration IDs and application outcomes are recorded here; no application ledger exists in Supabase.

### Admin dashboard smoke test

Use the deployed/local application configured with this new project's URL and
server-only service-role key.

- [x] Admin sign-in succeeds (user-confirmed working on 2026-10-06).
- [x] The dashboard agent list loads without a permission or hydration error (user-confirmed working on 2026-10-06).
- [x] Create a temporary draft agent with a unique test slug and confirm it appears in the dashboard (user-confirmed working on 2026-10-06).
- [x] Edit that draft and confirm the updated value persists after reload (user-confirmed working on 2026-10-06).
- [ ] The current admin UI has no delete action. After confirming create and update, remove only this uniquely named test row from Supabase Table Editor, or keep it as a clearly labeled draft.
- [x] Sign out; confirm the dashboard returns to the key-entry screen and the old session is rejected (user-confirmed working on 2026-10-06).

Automated local boundary test: passed on 2026-10-06 (12 unauthenticated/wrong-origin checks); `/admin` rendered its dashboard-key form in the local browser.  
Authenticated admin test date/time: user-confirmed working on 2026-10-06.  
Result: user confirmed admin sign-in, agent list, draft create/edit/reload, and sign-out work.

### Saved-agent smoke test

Test with an ordinary confirmed user account, not a service-role key. The
service-role key bypasses RLS and cannot verify user isolation.

- [x] Sign in as User A and save one published agent (user-confirmed saved-agent flow).
- [x] Confirm it appears in `/account` after refresh (user-confirmed saved-agent flow).
- [x] Remove it and confirm it disappears after refresh (user-confirmed saved-agent flow).
- [x] Sign in as User B and confirm User A's saved agent is not visible (two-user isolation user-confirmed).
- [x] Confirm a non-published agent cannot be saved (user-confirmed saved-agent privacy).

Unauthenticated local `/account` check: passed on 2026-10-06; the page showed the sign-in prompt.  
Authenticated saved-agent test date/time: user-confirmed working on 2026-10-06.  
Result: user confirmed the saved-agent flow and isolation between two ordinary user accounts.

### Local route smoke test

- [x] Automated local route smoke test passed on 2026-10-06 (17 source checks and 14 live routes).

Result: verifies route availability and public route invariants only; does not establish production hosting or external service health.

## Progress update protocol

For each future SQL change, send the exact filename and whether it succeeded,
for example: `026-agenthive-71-project-catalog.sql (026) succeeded at
YYYY-MM-DD HH:MM local time`. Report failures with the filename and a
secret-redacted error. Update this checkpoint after each report. Never send
keys, passwords, connection strings, or unredacted SQL errors.
