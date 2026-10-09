alter table public.agents
  add column if not exists metadata_last_checked_at timestamptz,
  add column if not exists metadata_source text,
  add column if not exists metadata_is_stale boolean not null default true,
  add column if not exists upstream_default_branch text,
  add column if not exists upstream_is_archived boolean;

create index if not exists agents_metadata_stale_idx
  on public.agents(metadata_is_stale, metadata_last_checked_at);
