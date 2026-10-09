alter table public.contribution_submissions
  drop constraint if exists contribution_submissions_request_type_check;

alter table public.contribution_submissions
  add constraint contribution_submissions_request_type_check
  check (request_type in ('correction', 'agent-suggestion', 'evidence', 'other', 'join-request'));
