do $$
begin
  if exists (
    select 1
    from public.contribution_submissions
    where source_url is not null
      and status in ('pending', 'in_review', 'accepted')
    group by source_url
    having count(*) > 1
  ) then
    raise exception 'Resolve duplicate active contribution source_url rows before applying migration 029';
  end if;

  if exists (
    select 1
    from public.trending_candidates
    where source_url is not null
    group by source_url
    having count(*) > 1
  ) then
    raise exception 'Resolve duplicate trending candidate source_url rows before applying migration 029';
  end if;
end
$$;

create unique index if not exists contribution_submissions_active_source_url_uidx
  on public.contribution_submissions(source_url)
  where source_url is not null and status in ('pending', 'in_review', 'accepted');

create unique index if not exists trending_candidates_source_url_uidx
  on public.trending_candidates(source_url);
