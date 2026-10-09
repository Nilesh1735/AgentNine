alter table public.trending_candidates
  add column if not exists reviewed_by text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists duplicate_of_agent_id uuid references public.agents(id) on delete set null,
  add column if not exists license_status text,
  add column if not exists setup_status text,
  add column if not exists source_checked_at timestamptz;

alter table public.trending_candidates
  drop constraint if exists trending_candidates_status_check;
alter table public.trending_candidates
  add constraint trending_candidates_status_check
  check (status in ('pending', 'approved', 'rejected', 'duplicate'));

create index if not exists trending_candidates_moderation_idx
  on public.trending_candidates(status, detected_at desc);
