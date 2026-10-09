
alter table public.agent_verifications
  add column if not exists verified_operating_systems text[],
  add column if not exists verified_install_command text,
  add column if not exists verified_first_task text,
  add column if not exists verification_failure_conditions text;

create or replace function public.sync_agent_verification_score()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.agents as a
  set
    verification_score =
      (new.pinned_checkout_passed::int
       + new.dependency_install_passed::int
       + new.provider_setup_passed::int
       + new.first_prompt_passed::int
       + new.normal_machine_run_passed::int),
    last_verified_date = new.checked_at::date,
    verified_commit_sha = case when new.verified_operating_systems is null then a.verified_commit_sha else new.source_commit_sha end,
    verified_operating_systems = case when new.verified_operating_systems is null then a.verified_operating_systems else new.verified_operating_systems end,
    verified_install_command = case when new.verified_operating_systems is null then a.verified_install_command else new.verified_install_command end,
    verified_first_task = case when new.verified_operating_systems is null then a.verified_first_task else new.verified_first_task end,
    verification_failure_conditions = case when new.verified_operating_systems is null then a.verification_failure_conditions else new.verification_failure_conditions end,
    verification_notes = case when new.verified_operating_systems is null then a.verification_notes else new.notes end
  where a.id = new.agent_id;
  return new;
end;
$$;

alter table public.contribution_submissions
  drop constraint if exists contribution_submissions_submitted_by_fkey;

alter table public.contribution_submissions
  add constraint contribution_submissions_submitted_by_fkey
  foreign key (submitted_by)
  references auth.users(id)
  on delete cascade;
