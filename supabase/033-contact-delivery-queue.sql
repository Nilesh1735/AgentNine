-- Add the durable contact notification queue before deploying the matching app.
-- This migration does not change existing public table grants.
begin;

create table public.contact_delivery_outbox (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique
    references public.contribution_submissions(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'sending', 'failed', 'delivered')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  delivered_at timestamptz
);

create index contact_delivery_outbox_status_updated_idx
  on public.contact_delivery_outbox(status, updated_at);

alter table public.contact_delivery_outbox enable row level security;
revoke all on public.contact_delivery_outbox from public, anon, authenticated;
grant select, insert, update on public.contact_delivery_outbox to service_role;

create or replace function public.create_contribution_submission_with_delivery(
  p_request_type text,
  p_name text,
  p_email text,
  p_source_url text,
  p_message text,
  p_submitted_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_id uuid;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'service role required';
  end if;

  insert into public.contribution_submissions (
    request_type, name, email, source_url, message, submitted_by
  )
  values (
    p_request_type, p_name, p_email, p_source_url, p_message, p_submitted_by
  )
  returning id into created_id;

  insert into public.contact_delivery_outbox (submission_id)
  values (created_id);

  return created_id;
end;
$$;

revoke all on function public.create_contribution_submission_with_delivery(text, text, text, text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.create_contribution_submission_with_delivery(text, text, text, text, text, uuid)
  to service_role;

create or replace function public.claim_contact_delivery(p_submission_id uuid)
returns table (
  submission_id uuid,
  request_type text,
  name text,
  email text,
  source_url text,
  message text,
  attempt_count integer
)
language sql
security definer
set search_path = ''
as $$
  with claimed as (
    update public.contact_delivery_outbox as delivery
    set
      status = 'sending',
      attempt_count = delivery.attempt_count + 1,
      last_error = null,
      updated_at = now()
    where delivery.submission_id = p_submission_id
      and (
        delivery.status in ('pending', 'failed')
        or (
          delivery.status = 'sending'
          and delivery.updated_at < now() - interval '10 minutes'
        )
      )
    returning delivery.submission_id, delivery.attempt_count
  )
  select
    submission.id,
    submission.request_type,
    submission.name,
    submission.email,
    submission.source_url,
    submission.message,
    claimed.attempt_count
  from claimed
  join public.contribution_submissions as submission
    on submission.id = claimed.submission_id;
$$;

revoke all on function public.claim_contact_delivery(uuid)
  from public, anon, authenticated;
grant execute on function public.claim_contact_delivery(uuid) to service_role;

commit;
