create table if not exists public.admin_login_log (
  id uuid primary key default gen_random_uuid(),
  success boolean not null,
  ip_address text,
  attempted_at timestamptz not null default now()
);
alter table public.admin_login_log add column if not exists ip_address text;
create index if not exists admin_login_log_attempted_idx on public.admin_login_log(attempted_at desc);
alter table public.admin_login_log enable row level security;

revoke all on public.admin_login_log from anon, authenticated;
grant insert, select on public.admin_login_log to service_role;
grant insert, select on public.agent_change_audit to service_role;
grant insert, select on public.agent_verifications to service_role;
