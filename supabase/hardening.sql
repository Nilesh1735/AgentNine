
alter table public.agents
  add column if not exists metadata_last_checked_at timestamptz,
  add column if not exists metadata_source text,
  add column if not exists metadata_is_stale boolean not null default true;

create table if not exists public.agent_verifications (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  checked_version text not null,
  source_commit_sha text,
  pinned_checkout_passed boolean not null default false,
  dependency_install_passed boolean not null default false,
  provider_setup_passed boolean not null default false,
  first_prompt_passed boolean not null default false,
  normal_machine_run_passed boolean not null default false,
  notes text,
  checked_at timestamptz not null default now(),
  checked_by text
);

create table if not exists public.agent_change_audit (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agents(id) on delete set null,
  changed_by text,
  change_reason text,
  previous_record jsonb,
  new_record jsonb,
  changed_at timestamptz not null default now()
);

alter table public.agents
  drop constraint if exists agents_status_check;
alter table public.agents
  add constraint agents_status_check
  check (status in ('draft', 'published', 'archived', 'needs_review'));

alter table public.agents
  drop constraint if exists agents_stars_check;
alter table public.agents
  add constraint agents_stars_check
  check (stars is null or stars >= 0);

update public.agents
set is_archived = (status = 'archived')
where is_archived is distinct from (status = 'archived');

alter table public.agents
  drop constraint if exists agents_archive_consistency_check;
alter table public.agents
  add constraint agents_archive_consistency_check
  check (is_archived = (status = 'archived'));

create index if not exists agents_status_idx on public.agents(status);
create index if not exists agents_category_id_idx on public.agents(category_id);
create index if not exists agents_last_verified_date_idx on public.agents(last_verified_date);
create index if not exists agent_verifications_agent_id_idx on public.agent_verifications(agent_id);
create index if not exists agent_verifications_checked_at_idx on public.agent_verifications(checked_at desc);

create or replace function public.sync_agent_verification_score()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.agents
  set
    verification_score =
      (new.pinned_checkout_passed::int
       + new.dependency_install_passed::int
       + new.provider_setup_passed::int
       + new.first_prompt_passed::int
       + new.normal_machine_run_passed::int),
    last_verified_date = new.checked_at::date
  where id = new.agent_id;
  return new;
end;
$$;

drop trigger if exists sync_agent_verification_score on public.agent_verifications;
create trigger sync_agent_verification_score
after insert or update on public.agent_verifications
for each row execute function public.sync_agent_verification_score();

alter table public.agent_verifications enable row level security;
alter table public.agent_change_audit enable row level security;
