
create table if not exists public.saved_agents (
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, agent_id)
);

create index if not exists saved_agents_user_created_idx
  on public.saved_agents(user_id, created_at desc);

alter table public.saved_agents enable row level security;

drop policy if exists "users read their saved agents" on public.saved_agents;
create policy "users read their saved agents"
  on public.saved_agents for select
  using (auth.uid() = user_id);

drop policy if exists "users save published agents" on public.saved_agents;
create policy "users save published agents"
  on public.saved_agents for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.agents
      where agents.id = saved_agents.agent_id
        and agents.status = 'published'
    )
  );

drop policy if exists "users remove their saved agents" on public.saved_agents;
create policy "users remove their saved agents"
  on public.saved_agents for delete
  using (auth.uid() = user_id);

grant select, insert, delete on table public.saved_agents to authenticated;
