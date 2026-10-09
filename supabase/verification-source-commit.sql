
alter table public.agent_verifications
  add column if not exists source_commit_sha text;

