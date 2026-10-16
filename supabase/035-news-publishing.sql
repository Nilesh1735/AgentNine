-- Create the public news collection and keep unpublished posts private.
begin;

create table public.news_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 3 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  summary text not null check (char_length(trim(summary)) between 1 and 300),
  content_markdown text not null check (char_length(trim(content_markdown)) between 1 and 100000),
  author_name text not null default 'AgentNine' check (char_length(trim(author_name)) between 1 and 100),
  source_urls text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index news_posts_published_at_idx
  on public.news_posts (published_at desc)
  where status = 'published';

alter table public.news_posts enable row level security;
revoke all on public.news_posts from public, anon, authenticated;
grant select on public.news_posts to anon, authenticated;
grant all on public.news_posts to service_role;

create policy "public can read published news"
  on public.news_posts
  for select
  to anon, authenticated
  using (status = 'published');

create or replace function public.set_news_post_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  if new.status = 'published' then
    if tg_op = 'INSERT' then
      new.published_at := now();
    elsif old.status <> 'published' then
      new.published_at := now();
    end if;
  else
    new.published_at := null;
  end if;
  return new;
end;
$$;

revoke all on function public.set_news_post_timestamps() from public, anon, authenticated;

create trigger news_posts_set_timestamps
  before insert or update on public.news_posts
  for each row execute function public.set_news_post_timestamps();

commit;
