update public.agents
set status = 'draft'
where status is null;

update public.agents
set is_archived = (status = 'archived')
where is_archived is distinct from (status = 'archived');

alter table public.agents
  alter column status set default 'draft',
  alter column status set not null,
  alter column is_archived set default false,
  alter column is_archived set not null;

update public.trending_candidates
set status = 'pending'
where status is null;

alter table public.trending_candidates
  alter column status set default 'pending',
  alter column status set not null;
