
alter table public.agents
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists revision bigint not null default 1;

create or replace function public.touch_agent_revision()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  new.revision = old.revision + 1;
  return new;
end;
$$;

drop trigger if exists touch_agent_revision on public.agents;
create trigger touch_agent_revision
before update on public.agents
for each row execute function public.touch_agent_revision();

alter table public.agents
  drop constraint if exists agents_status_check;
alter table public.agents
  add constraint agents_status_check
  check (status in ('draft', 'needs_review', 'published', 'archived'));

alter table public.agents
  drop constraint if exists agents_verification_score_check;
alter table public.agents
  add constraint agents_verification_score_check
  check (verification_score is null or verification_score between 0 and 5);

alter table public.agents
  drop constraint if exists agents_stars_check;
alter table public.agents
  add constraint agents_stars_check
  check (stars is null or stars >= 0);

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    join pg_attribute att
      on att.attrelid = con.conrelid
     and att.attnum = any (con.conkey)
    where con.conrelid = 'public.agents'::regclass
      and con.contype = 'f'
      and att.attname = 'category_id'
  loop
    execute format(
      'alter table public.agents drop constraint %I',
      constraint_name
    );
  end loop;
end
$$;

alter table public.agents
  add constraint agents_category_id_fkey
  foreign key (category_id)
  references public.categories(id)
  on delete set null;

create index if not exists agents_status_updated_at_idx
  on public.agents(status, updated_at desc);
create index if not exists agents_category_status_idx
  on public.agents(category_id, status);
