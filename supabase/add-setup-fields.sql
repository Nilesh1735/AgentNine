
alter table public.agents
  add column if not exists setup_steps jsonb;

alter table public.agents
  add column if not exists verification_score integer default 0;

alter table public.agents
  drop constraint if exists agents_verification_score_check;

alter table public.agents
  add constraint agents_verification_score_check
  check (verification_score between 0 and 5);
