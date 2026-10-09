create table if not exists public.visitor_preferences (
  visitor_id uuid primary key,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.visitor_preferences enable row level security;
revoke all on public.visitor_preferences from anon, authenticated;
grant select, insert, update, delete on public.visitor_preferences to service_role;

create index if not exists visitor_preferences_updated_at_idx
  on public.visitor_preferences (updated_at);

create or replace function public.merge_visitor_preferences(
  p_visitor_id uuid,
  p_patch jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  merged_preferences jsonb;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service role required';
  end if;

  insert into public.visitor_preferences (visitor_id, preferences)
  values (p_visitor_id, jsonb_strip_nulls(coalesce(p_patch, '{}'::jsonb)))
  on conflict (visitor_id) do update
    set preferences = jsonb_strip_nulls(visitor_preferences.preferences || coalesce(p_patch, '{}'::jsonb)),
        updated_at = now()
  returning preferences into merged_preferences;

  return merged_preferences;
end;
$$;

revoke all on function public.merge_visitor_preferences(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.merge_visitor_preferences(uuid, jsonb) to service_role;
