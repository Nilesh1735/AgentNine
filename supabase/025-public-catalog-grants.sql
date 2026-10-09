grant select on table public.agents, public.categories to anon, authenticated;
grant select, update on table public.agents to service_role;
grant select on table public.categories to service_role;
