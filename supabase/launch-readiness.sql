
alter table public.agents
  add column if not exists verified_commit_sha text,
  add column if not exists verified_operating_systems text[] not null default '{}',
  add column if not exists verified_install_command text,
  add column if not exists verified_first_task text,
  add column if not exists verification_failure_conditions text,
  add column if not exists verification_notes text,
  add column if not exists upstream_changed_since_verification boolean not null default false,
  add column if not exists last_release_at timestamptz;

create table if not exists public.contribution_submissions (
  id uuid primary key default gen_random_uuid(),
  request_type text not null check (request_type in ('correction','agent-suggestion','evidence','other')),
  name text not null,
  email text not null,
  source_url text,
  message text not null,
  submitted_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','in_review','accepted','rejected','duplicate')),
  duplicate_of uuid references public.contribution_submissions(id) on delete set null,
  reviewed_by text,
  reviewed_at timestamptz,
  outcome text,
  created_at timestamptz not null default now()
);

alter table public.contribution_submissions
  drop constraint if exists contribution_submissions_request_type_check;
alter table public.contribution_submissions
  add constraint contribution_submissions_request_type_check
  check (request_type in ('correction','agent-suggestion','evidence','other','join-request'));

create index if not exists contribution_submissions_status_idx
  on public.contribution_submissions(status, created_at desc);

create table if not exists public.category_follows (
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, category_id)
);

create table if not exists public.saved_agent_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  event_type text not null check (event_type in ('saved','updated','rechecked','comparison_created')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.contribution_submissions enable row level security;
alter table public.category_follows enable row level security;
alter table public.saved_agent_events enable row level security;

drop policy if exists "users read their category follows" on public.category_follows;
create policy "users read their category follows" on public.category_follows for select using (auth.uid() = user_id);
drop policy if exists "users manage their category follows" on public.category_follows;
create policy "users manage their category follows" on public.category_follows for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "users read their saved agent events" on public.saved_agent_events;
create policy "users read their saved agent events" on public.saved_agent_events for select using (auth.uid() = user_id);

revoke all on public.contribution_submissions from anon, authenticated;
grant insert on public.contribution_submissions to anon, authenticated;
grant select, insert, delete on public.category_follows to authenticated;
grant select on public.saved_agent_events to authenticated;
