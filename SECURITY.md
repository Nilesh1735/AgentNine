# Security policy

## Reporting a vulnerability

Do not include secrets or exploit details in public issues. Send a private report to the monitored address configured as `NEXT_PUBLIC_CONTACT_EMAIL`, or to the project owner through the repository's private security-advisory workflow.

AgentNine is a directory and does not control the security of listed upstream projects. Report upstream vulnerabilities to the affected project's security channel as well.

## Security boundaries

- Public Supabase access is read-only and limited by RLS.
- Service-role credentials are server-only and must never be exposed to browser code.
- Catalog content is external-project metadata, not a security certification.
- The report endpoint validates a slug and persists it in the service-role-only `broken_link_reports` queue before attempting external forwarding. Forwarding failure does not discard the queued report. Both queue and admin views require migration 023.
- Admin authentication fails closed when `ADMIN_DASHBOARD_KEY` is missing. Sessions use HMAC-signed HttpOnly cookies, a separate CSRF token, same-origin validation, and a database-backed session-revocation lookup. Authentication is still a shared key, not named admin accounts.
- Admin login throttling uses the shared Upstash-backed rate limiter when its production credentials are configured; local development and tests use process-local memory. Production must fail closed if the shared limiter is unavailable.
- Agent create/update and the associated change-audit record use transactional SQL RPCs. Individual verification evidence insertion synchronizes the checklist score, verification date, commit, setup evidence, and notes through the database trigger installed by migration 022, in the same transaction. The trigger must exist in the live database for that guarantee.
- Analytics and feedback are anonymous, bounded, and RLS-protected. The analytics API returns an error response when storage is unavailable, and feedback summary failures return an error response rather than a zero-count success. Client analytics is best-effort and does not block user actions.
- The admin console includes audit history, login outcome history, metadata staleness, broken-link reports, and daily analytics aggregates after migration 023. Audit rows expose changed field names, not before/after values; login history omits IP addresses; analytics returns daily event counts without event properties. It still has no named admin identities, MFA, or per-person roles. It does have server-side session revocation through `admin_session_revocations`. The shared dashboard key is an MVP boundary and must be rotated if exposed.
- Account deletion requires migration 023 and removes account-linked submissions before deleting the Auth user. The purge RPC also removes older submissions matching the exact account email. Anonymous feedback, analytics, and admin-login records are not tied to the account and are not deleted by that operation; their retention needs a separate policy and workflow.

## Production security checklist

Before public deployment:

1. Apply and verify migrations using the full ordered runbook in `supabase/MIGRATIONS.md`; do not treat this abbreviated list as the complete migration sequence.
2. Configure a high-entropy `ADMIN_DASHBOARD_KEY` and `SUPABASE_SERVICE_ROLE_KEY` only in server-side deployment secrets.
3. Configure and verify the distributed Upstash limiter and add alerting for repeated login failures.
4. Move from shared-key admin access to Supabase Auth with named accounts, roles, password recovery, and MFA when more than one administrator exists.
5. Apply and verify migration 022 so the verification evidence trigger is installed; check score/date/setup evidence after a test insert in a non-production project.
6. Run deployed smoke tests for TLS, CSP, cookies, RLS, robots, sitemap, admin authorization, and source-map exposure.
7. Configure backups, restore testing, dependency/security alerts, and monitoring. Secret rotation is not automated or verifiable by repository checks: record the owner/date in a restricted operations log, replace credentials through the production secret manager, verify dependent routes/jobs, then revoke old credentials. Rotation immediately invalidates active shared-key admin sessions because there is one active dashboard key.
