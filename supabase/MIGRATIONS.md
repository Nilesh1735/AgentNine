# Supabase migration runbook

This is the authoritative application order for the SQL in this directory. The
SQL files predate this manifest and remain individually runnable, but they are
not an unordered batch. Apply one entry at a time and record the filename,
timestamp, and result in the deployment log.
Applied migration files remain separate, including small compatibility and
permission changes. Do not combine or renumber them after deployment; preserve
the recorded IDs and use a new forward-only migration for future changes.

## Numbered order

| ID | File | Kind | Notes |
| --- | --- | --- | --- |
| 001 | `schema.sql` | schema | Required baseline tables and RLS policies |
| 002 | `add-setup-fields.sql` | migration | Setup fields and score constraint |
| 003 | Retired | retired | Legacy 25-agent catalog import removed; ID preserved |
| 004 | Retired | retired | Legacy 50-agent catalog import removed; ID preserved |
| 005 | Retired | retired | Legacy seed-data correction removed; ID preserved |
| 006 | `hardening.sql` | migration | Verification evidence, audit history, and baseline constraints |
| 007 | `verification-source-commit.sql` | compatibility migration | Adds the commit field to older verification tables |
| 008 | `agent-concurrency.sql` | migration | Adds the positive revision guard |
| 009 | `database-hardening.sql` | migration | Revision timestamps, triggers, indexes, and FK behavior |
| 010 | `source-integrity.sql` | migration | Source URL, status, and star validation |
| 011 | `metadata-integrity.sql` | migration | GitHub metadata provenance and freshness fields |
| 012 | `candidate-moderation.sql` | migration | Review state and provenance for discovered repositories |
| 013 | `admin-security.sql` | migration | Service-role grants and admin login audit table |
| 014 | `admin-session-revocation.sql` | migration | Server-side invalidation of admin sessions |
| 015 | `agent-admin-rpcs.sql` | migration | Transactional admin catalog functions; requires 006, 009, and 013 |
| 016 | `feature-migrations.sql` | migration | Public feedback and privacy-conscious analytics |
| 017 | `account-features.sql` | migration | Authenticated saved-agent records; requires 016 |
| 018 | `category-copy-cleanup.sql` | data correction | Replaces generic coding-category description |
| 019 | `launch-readiness.sql` | feature migration | Evidence fields, contributions, follows, and saved-agent history |
| 020 | `020-visitor-preferences.sql` | feature migration | Server-managed anonymous preferences with service-role-only access |
| 021 | `021-analytics-event-names.sql` | compatibility migration | Aligns the analytics event constraint with the application event allowlist |
| 022 | `022-verification-atomicity-and-user-deletion.sql` | migration | Atomically synchronizes verification evidence and cascades account-owned contributions on user deletion |
| 023 | `023-admin-operations-and-related-agents.sql` | feature migration | Adds protected admin operations data, analytics aggregation, related-agent query, and account-submission deletion RPC |
| 024 | `join-requests.sql` | compatibility migration | Allows join requests in the existing contribution request-type constraint |
| 025 | `025-public-catalog-grants.sql` | permissions migration | Grants public catalog reads and server-only service-role catalog access; RLS continues to restrict public agent rows to published records |
| 026 | `026-agenthive-71-project-catalog.sql` | catalog data migration | Ensures required category slugs exist, then additively upserts the 71 audited Automation, Coding, Research and Content repositories; flags identity/license/source conflicts for review and leaves all other agent rows untouched |
| 027 | `027-contribution-submission-service-only.sql` | permissions migration | Removes unused direct client table grants for contribution submissions and grants server-side service-role access only |
| 028 | `028-state-columns-not-null.sql` | integrity migration | Backfills nullable publication/moderation states and enforces non-null status/archive values with existing defaults |
| 029 | `029-concurrent-submission-deduplication.sql` | integrity migration | Adds database uniqueness guarantees for active contribution sources and trending candidates |
| 030 | `030-evidence-based-setup-guides.sql` | catalog migration | Adds structured, source-dated setup guides; updates admin catalog RPCs to preserve them; seeds README references and only explicit OS-specific commands for all 71 catalog agents, preserving admin-authored guides and leaving undocumented commands empty |
| 031 | `031-complete-setup-install-routes.sql` | catalog data correction | Adds verified install commands and official desktop download links missed by the initial audit; merges per-platform fields without replacing existing admin-authored commands |
| 032 | `032-complete-os-coverage.sql` | catalog data correction | Adds verified Windows Gemini CLI, macOS Crush, and macOS ComfyUI routes; records explicit unknown states for unverified OS slots; corrects the Windows command-code launcher without replacing verified/admin-authored routes |

Migration IDs 003–005 are retired and intentionally not reused. The old
25-agent and 50-agent catalog imports and their seed-data correction are no
longer part of the supported setup. Migration 026 is the current catalog import.
Its source references are maintained in `CATALOG-SOURCES.md`, separate from the
executable SQL. Migration filenames and IDs remain immutable after deployment;
026 retains its historical filename.
Migration 017 grants authenticated users the table privileges needed to use
saved agents; row-level security still restricts each user's rows. Migration
025 grants the server-only service role catalog access needed by admin APIs.
Migration 027 restricts contribution submission reads and writes to the
server-side service role, matching the application API's access pattern.
Migration 028 aligns the agent archive flag with publication status and makes
agent and candidate state columns non-null, preventing invalid null states.
Migration 029 prevents concurrent requests from creating duplicate active
contribution submissions for the same source and duplicate trending candidates.
It stops with an explicit error if existing duplicates must be reviewed first.
Migration 030 adds an evidence-based setup guide stored separately from legacy
commands. Each platform can be marked supported, unsupported, or unknown, with
documented prerequisites, install and first-run commands, provider setup,
uninstall/data-retention instructions, and the source/version/check date. The
migration seeds source references for all 71 catalog agents, plus commands
verified during that audit. Migration 031 fills additional verified command and
installer-link gaps. It preserves non-empty platform commands and existing
admin-authored fields. A download link is used where the upstream project
distributes a desktop installer instead of a shell command. Unknown remains the
default when no upstream source supports a claim; do not infer OS support from
runtime availability or an unverified catalog note. iOS is intentionally not
part of the guide model. Migration 032 fills missing OS slots with an explicit
unknown state instead of implying either support or non-support. It adds three
routes verified against current upstream install instructions and corrects the
Windows `command-code` first-run invocation. Its conditional updates leave any
already populated, verified, or administrator-authored platform data intact.

Verify migration 030 before editing setup guides in the admin dashboard:

```sql
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'agents'
  and column_name = 'setup_guide';

select p.proname,
       has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_can_execute,
       has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute
from pg_proc p
where p.pronamespace = 'public'::regnamespace
  and p.proname in ('admin_create_agent', 'admin_update_agent')
order by p.proname;

-- After migration 032, this should return no rows for agents missing an
-- explicit Windows, macOS, or Linux state.
select agents.slug,
       expected_os.operating_system
from public.agents
cross join (values ('windows'), ('macos'), ('linux')) as expected_os(operating_system)
where agents.status = 'published'
  and not (
    coalesce(agents.setup_guide->'platforms', '{}'::jsonb)
    ? expected_os.operating_system
  )
order by agents.slug, expected_os.operating_system;

-- After migration 032, this should return no supported platforms lacking a
-- verified command or an official installer link.
select agents.slug,
       platform.key as operating_system,
       platform.value->>'install_route' as install_route
from public.agents
cross join lateral jsonb_each(
  coalesce(agents.setup_guide->'platforms', '{}'::jsonb)
) as platform
where agents.status = 'published'
  and platform.value->>'support' = 'supported'
  and coalesce(platform.value->'install_commands', '[]'::jsonb) = '[]'::jsonb
  and platform.value->>'download_url' is null
order by agents.slug, platform.key;
```

## Fresh project

1. Create the Supabase project and enable the required Auth providers.
2. Run `schema.sql` (001), then `add-setup-fields.sql` (002).
3. Run 006 through 032 in order, one file at a time. Record each result in
   `DEPLOYMENT-CHECKPOINT.md`; mark failed files failed and stop until resolved.
4. Verify the schema, privileges, and RLS policies with the checks below before
   putting admin or account features into service.
5. Configure the application secrets from `.env.example`; never expose
   `SUPABASE_SERVICE_ROLE_KEY` to the browser.
6. Run the admin and saved-agent smoke tests from the checkpoint before launch.

## Existing project or release

Take a Supabase backup (or confirm point-in-time recovery) before applying a
new entry. Compare the live schema with the migration's objects, then apply the
first unapplied numbered entry only. Do not rerun seed imports against a live
catalog unless the import has been reviewed for duplicate or changed records.
Record the applied ID in the release log and deploy the application only after
the SQL succeeds.

Post-migration checks:

```sql
select to_regclass('public.agents') as agents,
       to_regclass('public.agent_verifications') as verifications,
       to_regclass('public.analytics_events') as analytics_events;

select status, count(*) from public.agents group by status order by status;

select proname
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('admin_create_agent', 'admin_update_agent',
                  'get_agent_helpfulness_summary', 'get_related_agents',
                  'get_admin_analytics_daily', 'delete_account_contribution_data');

select id, agent_slug, status, created_at
from public.broken_link_reports
order by created_at desc
limit 5;

select pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.analytics_events'::regclass
  and conname = 'analytics_events_event_name_check';

select pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.contribution_submissions'::regclass
  and conname = 'contribution_submissions_request_type_check';

select relname, relrowsecurity
from pg_class
where oid in (
  'public.agents'::regclass,
  'public.categories'::regclass,
  'public.saved_agents'::regclass
);
```

Verify migration 029's database-enforced deduplication:

```sql
select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'contribution_submissions_active_source_url_uidx',
    'trending_candidates_source_url_uidx'
  )
order by indexname;

select count(*) as invalid_agent_states
from public.agents
where status is null
   or is_archived is null
   or is_archived is distinct from (status = 'archived');

select count(*) as invalid_candidate_states
from public.trending_candidates
where status is null;

select
  has_table_privilege('service_role', 'public.agents', 'SELECT') as admin_can_read_agents,
  has_table_privilege('service_role', 'public.agents', 'UPDATE') as admin_can_update_agents,
  has_table_privilege('service_role', 'public.categories', 'SELECT') as admin_can_read_categories,
  has_table_privilege('service_role', 'public.contribution_submissions', 'SELECT') as server_can_read_contributions,
  has_table_privilege('service_role', 'public.contribution_submissions', 'INSERT') as server_can_write_contributions,
  has_table_privilege('anon', 'public.contribution_submissions', 'INSERT') as anon_can_write_contributions,
  has_table_privilege('authenticated', 'public.contribution_submissions', 'INSERT') as users_can_write_contributions,
  has_table_privilege('authenticated', 'public.saved_agents', 'SELECT') as users_can_read_saved_agents,
  has_table_privilege('authenticated', 'public.saved_agents', 'INSERT') as users_can_save_agents,
  has_table_privilege('authenticated', 'public.saved_agents', 'DELETE') as users_can_remove_saved_agents;

select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('agents', 'saved_agents')
order by tablename, policyname;
```

The checks confirm required tables/functions, accepted analytics event names,
admin and saved-agent table privileges, and the catalog/account RLS policies.
`anon_can_write_contributions` and `users_can_write_contributions` must be
false; all other privilege booleans should be true. The contribution request
type constraint must include `join-request`, and `relrowsecurity` must be true
for all three checked tables. Both invalid-state counts must be zero. Confirm
the policies are present, then
test with a normal authenticated account as described in
`DEPLOYMENT-CHECKPOINT.md`. Do not test saved-agent RLS with the service-role
key, which bypasses RLS.

## Rollback and recovery

These files deliberately contain no destructive down-migrations. Do not
`DROP TABLE`, delete catalog rows, or manually reverse a partially applied
release in production. If an entry fails:

1. Stop the application release and keep the previous application version
   available.
2. Capture the SQL error and inspect which statements in that entry committed.
   Re-run only after confirming the file's `if not exists`/replacement behavior
   is safe for the observed state.
3. Restore the pre-release backup or use point-in-time recovery only when the
   partial state cannot be repaired safely.
4. Prefer a new, forward-only corrective SQL file (with the next number) for a
   recoverable mismatch, and update this manifest before applying it.
5. Redeploy the previous application version until the schema and application
   contract agree, then rerun the post-migration checks.

For a local or disposable project, restore from a fresh database instead of
inventing a rollback script. Schema changes can be transaction-wrapped by the
operator where supported, but each file should still be treated as a separate
release unit.
