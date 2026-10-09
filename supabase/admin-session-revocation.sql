create table if not exists public.admin_session_revocations (
  session_id text primary key,
  revoked_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists admin_session_revocations_expiry_idx
  on public.admin_session_revocations(expires_at);

alter table public.admin_session_revocations enable row level security;
revoke all on public.admin_session_revocations from anon, authenticated;
grant select, insert, update on public.admin_session_revocations to service_role;
