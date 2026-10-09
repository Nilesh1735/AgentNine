
create table if not exists public.agent_helpfulness (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  respondent_id uuid not null,
  helpful boolean not null,
  created_at timestamptz not null default now(),
  unique (agent_id, respondent_id)
);

create index if not exists agent_helpfulness_agent_idx
  on public.agent_helpfulness(agent_id);

alter table public.agent_helpfulness enable row level security;

drop policy if exists "public submit helpfulness" on public.agent_helpfulness;
create policy "public submit helpfulness"
  on public.agent_helpfulness for insert
  with check (
    exists (
      select 1 from public.agents
      where agents.id = agent_helpfulness.agent_id
        and agents.status = 'published'
    )
  );

create or replace function public.get_agent_helpfulness_summary(p_agent_id uuid)
returns table(helpful_count bigint, not_helpful_count bigint)
language sql
security definer
set search_path = public
as $$
  select
    count(*) filter (where helpful) as helpful_count,
    count(*) filter (where not helpful) as not_helpful_count
  from public.agent_helpfulness
  where agent_id = p_agent_id
    and exists (
      select 1 from public.agents
      where agents.id = p_agent_id and agents.status = 'published'
    );
$$;

revoke all on function public.get_agent_helpfulness_summary(uuid) from public;
grant execute on function public.get_agent_helpfulness_summary(uuid) to anon, authenticated;

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null check (event_name in ('agent_view', 'search', 'feedback_submitted', 'source_click')),
  session_id uuid not null,
  page_path text not null check (char_length(page_path) between 1 and 500),
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_created_idx
  on public.analytics_events(created_at desc);
create index if not exists analytics_events_name_idx
  on public.analytics_events(event_name, created_at desc);

alter table public.analytics_events enable row level security;

drop policy if exists "public submit privacy conscious analytics" on public.analytics_events;
create policy "public submit privacy conscious analytics"
  on public.analytics_events for insert
  with check (jsonb_typeof(properties) = 'object');

revoke all on public.analytics_events from anon, authenticated;
revoke all on public.agent_helpfulness from anon, authenticated;
grant insert on public.analytics_events to anon, authenticated;
grant insert on public.agent_helpfulness to anon, authenticated;
