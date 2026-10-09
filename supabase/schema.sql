create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text
);

create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  short_description text not null,
  category_id uuid references categories(id),
  tags text[] default '{}',
  github_url text not null,
  version_tag text not null,
  os_commands jsonb,
  env_template text,
  common_errors text,
  hardware_requirements text,
  port_mapping text,
  memory_location text,
  network_access text,
  file_access text,
  uninstall_command text,
  first_launch_prompt text,
  cost_to_run text,
  requires_api_key boolean default false,
  is_flagship boolean default false,
  status text default 'draft',
  last_verified_date date,
  stars int,
  last_commit_at timestamptz,
  is_archived boolean default false,
  verification_score int default 0 check (verification_score between 0 and 5),
  revision bigint not null default 1 constraint agents_revision_positive check (revision > 0),
  setup_steps jsonb,
  setup_guide jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists trending_candidates (
  id uuid primary key default gen_random_uuid(),
  agent_name_guess text,
  source_type text,
  source_url text,
  creator_name text,
  detected_at timestamptz default now(),
  status text default 'pending'
);

alter table agents enable row level security;
alter table categories enable row level security;
alter table trending_candidates enable row level security;
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'agents'
      and policyname = 'public read published agents'
  ) then
    create policy "public read published agents"
      on agents for select using (status = 'published');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'categories'
      and policyname = 'public read categories'
  ) then
    create policy "public read categories"
      on categories for select using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'trending_candidates'
      and policyname = 'admin manage trending candidates'
  ) then
    create policy "admin manage trending candidates"
      on trending_candidates for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end
$$;

grant select on table public.agents, public.categories to anon, authenticated;
