alter table public.analytics_events
  drop constraint if exists analytics_events_event_name_check;

alter table public.analytics_events
  add constraint analytics_events_event_name_check
  check (event_name in (
    'agent_view',
    'search',
    'search_success',
    'search_zero_results',
    'feedback_submitted',
    'source_click',
    'agent_saved',
    'comparison_changed',
    'api_error',
    'admin_error'
  ));
