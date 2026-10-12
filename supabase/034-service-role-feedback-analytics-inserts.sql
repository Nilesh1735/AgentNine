-- Deploy the matching API code before applying this permissions migration.
begin;

revoke all on table public.analytics_events from public, anon, authenticated;
revoke all on table public.agent_helpfulness from public, anon, authenticated;

grant insert on table public.analytics_events to service_role;
grant insert on table public.agent_helpfulness to service_role;

drop policy if exists "public submit privacy conscious analytics" on public.analytics_events;
drop policy if exists "public submit helpfulness" on public.agent_helpfulness;

commit;
