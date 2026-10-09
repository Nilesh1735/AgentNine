do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'agents_github_url_https_github') then
    alter table agents
      add constraint agents_github_url_https_github
      check (
        github_url ~ '^https://github\.com/[^/]+/[^/]+/?$'
        and github_url not like '%@%'
      );
  end if;
  if not exists (select 1 from pg_constraint where conname = 'agents_stars_nonnegative') then
    alter table agents
      add constraint agents_stars_nonnegative
      check (stars is null or stars >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'agents_status_valid') then
    alter table agents
      add constraint agents_status_valid
      check (status in ('draft', 'needs_review', 'published', 'archived'));
  end if;
end
$$;
