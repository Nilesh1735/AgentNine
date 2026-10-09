create table if not exists public.broken_link_reports (
  id uuid primary key default gen_random_uuid(),
  agent_slug text not null,
  status text not null default 'pending'
    check (status in ('pending', 'in_review', 'resolved', 'ignored')),
  created_at timestamptz not null default now(),
  forwarded_at timestamptz,
  forwarding_error text,
  resolved_at timestamptz,
  resolved_by text
);

create index if not exists broken_link_reports_status_created_idx
  on public.broken_link_reports(status, created_at desc);

alter table public.broken_link_reports enable row level security;
revoke all on public.broken_link_reports from public, anon, authenticated;
grant select, insert, update on public.broken_link_reports to service_role;

create or replace function public.get_related_agents(p_agent_id uuid, p_limit integer default 3)
returns setof public.agents
language sql
stable
security definer
set search_path = public
as $$
  with target as (
    select id, category_id, coalesce(tags, '{}'::text[]) as tags
    from public.agents
    where id = p_agent_id and status = 'published'
  )
  select candidate.*
  from public.agents as candidate
  cross join target
  cross join lateral (
    select
      (case when candidate.category_id is not distinct from target.category_id then 3 else 0 end)
      + (
        select count(distinct lower(candidate_tag))::integer
        from unnest(coalesce(candidate.tags, '{}'::text[])) as candidate_tags(candidate_tag)
        where exists (
          select 1
          from unnest(target.tags) as target_tags(target_tag)
          where lower(target_tag) = lower(candidate_tag)
        )
      ) as relevance
  ) as rank
  where candidate.status = 'published'
    and candidate.id <> target.id
    and rank.relevance > 0
  order by rank.relevance desc, candidate.name
  limit least(greatest(coalesce(p_limit, 3), 1), 10);
$$;

revoke all on function public.get_related_agents(uuid, integer) from public;
grant execute on function public.get_related_agents(uuid, integer) to anon, authenticated, service_role;

create or replace function public.get_admin_analytics_daily(p_days integer default 30)
returns table(day date, event_name text, event_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    analytics.created_at::date as day,
    analytics.event_name,
    count(*) as event_count
  from public.analytics_events as analytics
  where auth.role() = 'service_role'
    and analytics.created_at >= now() - make_interval(days => least(greatest(coalesce(p_days, 30), 1), 90))
  group by analytics.created_at::date, analytics.event_name
  order by day desc, event_count desc;
$$;

revoke all on function public.get_admin_analytics_daily(integer) from public, anon, authenticated;
grant execute on function public.get_admin_analytics_daily(integer) to service_role;

create or replace function public.delete_account_contribution_data(p_user_id uuid, p_email text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'service role required';
  end if;

  delete from public.contribution_submissions
  where submitted_by = p_user_id
     or (p_email is not null and lower(email) = lower(p_email));

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.delete_account_contribution_data(uuid, text) from public, anon, authenticated;
grant execute on function public.delete_account_contribution_data(uuid, text) to service_role;
