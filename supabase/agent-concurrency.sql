alter table public.agents
  add column if not exists revision bigint not null default 1;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.agents'::regclass
      and conname = 'agents_revision_positive'
  ) then
    alter table public.agents
      add constraint agents_revision_positive check (revision > 0);
  end if;
end
$$;
