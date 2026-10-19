begin;

create table public.site_feedback (
  id uuid primary key default gen_random_uuid(),
  display_name text check (display_name is null or char_length(btrim(display_name)) between 1 and 80),
  message text not null check (char_length(btrim(message)) between 10 and 1200),
  publication_consent boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  published_at timestamptz
);

create index site_feedback_published_idx
  on public.site_feedback (published_at desc)
  where status = 'published' and publication_consent = true;

alter table public.site_feedback enable row level security;
revoke all on public.site_feedback from public, anon, authenticated;
grant all on public.site_feedback to service_role;

create or replace function public.set_site_feedback_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  if new.status = 'published' then
    if tg_op = 'INSERT' then
      new.published_at := pg_catalog.now();
    elsif old.status <> 'published' then
      new.published_at := pg_catalog.now();
    end if;
  else
    new.published_at := null;
  end if;
  return new;
end;
$$;

revoke all on function public.set_site_feedback_timestamps() from public, anon, authenticated;

create trigger site_feedback_set_timestamps
  before insert or update on public.site_feedback
  for each row execute function public.set_site_feedback_timestamps();

commit;
