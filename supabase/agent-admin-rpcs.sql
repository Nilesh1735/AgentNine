
create or replace function public.admin_create_agent(
  p_agent jsonb,
  p_changed_by text default 'admin'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_agent public.agents;
begin
  insert into public.agents (
    name, slug, short_description, category_id, tags, github_url, version_tag,
    os_commands, env_template, common_errors, hardware_requirements,
    port_mapping, memory_location, network_access, file_access,
    uninstall_command, first_launch_prompt, cost_to_run, requires_api_key,
    is_flagship, status, last_verified_date, stars, last_commit_at,
    is_archived, setup_steps, setup_guide
  )
  select
    p_agent->>'name', p_agent->>'slug', p_agent->>'short_description',
    (p_agent->>'category_id')::uuid,
    (select array_agg(value) from jsonb_array_elements_text(p_agent->'tags')),
    p_agent->>'github_url',
    p_agent->>'version_tag', p_agent->'os_commands', p_agent->>'env_template',
    p_agent->>'common_errors', p_agent->>'hardware_requirements',
    p_agent->>'port_mapping', p_agent->>'memory_location', p_agent->>'network_access',
    p_agent->>'file_access', p_agent->>'uninstall_command',
    p_agent->>'first_launch_prompt', p_agent->>'cost_to_run',
    coalesce((p_agent->>'requires_api_key')::boolean, false),
    coalesce((p_agent->>'is_flagship')::boolean, false),
    coalesce(p_agent->>'status', 'draft'),
    (p_agent->>'last_verified_date')::date, (p_agent->>'stars')::integer,
    (p_agent->>'last_commit_at')::timestamptz,
    coalesce((p_agent->>'is_archived')::boolean, false), p_agent->'setup_steps',
    coalesce(p_agent->'setup_guide', '{}'::jsonb)
  returning * into inserted_agent;

  insert into public.agent_change_audit (
    agent_id, changed_by, change_reason, new_record
  )
  values (
    inserted_agent.id, p_changed_by, 'create', to_jsonb(inserted_agent)
  );

  return jsonb_build_object('status', 'ok', 'agent', to_jsonb(inserted_agent));
end;
$$;

create or replace function public.admin_update_agent(
  p_agent_id uuid,
  p_expected_revision bigint,
  p_agent jsonb,
  p_changed_by text default 'admin'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_agent public.agents;
  updated_agent public.agents;
begin
  select * into previous_agent
  from public.agents
  where id = p_agent_id
  for update;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  if previous_agent.revision <> p_expected_revision then
    return jsonb_build_object('status', 'conflict');
  end if;

  update public.agents
  set
    name = case when p_agent ? 'name' then p_agent->>'name' else previous_agent.name end,
    slug = case when p_agent ? 'slug' then p_agent->>'slug' else previous_agent.slug end,
    short_description = case when p_agent ? 'short_description' then p_agent->>'short_description' else previous_agent.short_description end,
    category_id = case when p_agent ? 'category_id' then (p_agent->>'category_id')::uuid else previous_agent.category_id end,
    tags = case when p_agent ? 'tags' then
      (select array_agg(value) from jsonb_array_elements_text(p_agent->'tags'))
      else previous_agent.tags end,
    github_url = case when p_agent ? 'github_url' then p_agent->>'github_url' else previous_agent.github_url end,
    version_tag = case when p_agent ? 'version_tag' then p_agent->>'version_tag' else previous_agent.version_tag end,
    os_commands = case when p_agent ? 'os_commands' then p_agent->'os_commands' else previous_agent.os_commands end,
    env_template = case when p_agent ? 'env_template' then p_agent->>'env_template' else previous_agent.env_template end,
    common_errors = case when p_agent ? 'common_errors' then p_agent->>'common_errors' else previous_agent.common_errors end,
    hardware_requirements = case when p_agent ? 'hardware_requirements' then p_agent->>'hardware_requirements' else previous_agent.hardware_requirements end,
    port_mapping = case when p_agent ? 'port_mapping' then p_agent->>'port_mapping' else previous_agent.port_mapping end,
    memory_location = case when p_agent ? 'memory_location' then p_agent->>'memory_location' else previous_agent.memory_location end,
    network_access = case when p_agent ? 'network_access' then p_agent->>'network_access' else previous_agent.network_access end,
    file_access = case when p_agent ? 'file_access' then p_agent->>'file_access' else previous_agent.file_access end,
    uninstall_command = case when p_agent ? 'uninstall_command' then p_agent->>'uninstall_command' else previous_agent.uninstall_command end,
    first_launch_prompt = case when p_agent ? 'first_launch_prompt' then p_agent->>'first_launch_prompt' else previous_agent.first_launch_prompt end,
    cost_to_run = case when p_agent ? 'cost_to_run' then p_agent->>'cost_to_run' else previous_agent.cost_to_run end,
    requires_api_key = case when p_agent ? 'requires_api_key' then (p_agent->>'requires_api_key')::boolean else previous_agent.requires_api_key end,
    is_flagship = case when p_agent ? 'is_flagship' then (p_agent->>'is_flagship')::boolean else previous_agent.is_flagship end,
    status = case when p_agent ? 'status' then p_agent->>'status' else previous_agent.status end,
    last_verified_date = case when p_agent ? 'last_verified_date' then (p_agent->>'last_verified_date')::date else previous_agent.last_verified_date end,
    stars = case when p_agent ? 'stars' then (p_agent->>'stars')::integer else previous_agent.stars end,
    last_commit_at = case when p_agent ? 'last_commit_at' then (p_agent->>'last_commit_at')::timestamptz else previous_agent.last_commit_at end,
    is_archived = case when p_agent ? 'is_archived' then (p_agent->>'is_archived')::boolean else previous_agent.is_archived end,
    setup_steps = case when p_agent ? 'setup_steps' then p_agent->'setup_steps' else previous_agent.setup_steps end,
    setup_guide = case when p_agent ? 'setup_guide' then p_agent->'setup_guide' else previous_agent.setup_guide end
  where id = p_agent_id and revision = p_expected_revision
  returning * into updated_agent;

  if not found then
    return jsonb_build_object('status', 'conflict');
  end if;

  insert into public.agent_change_audit (
    agent_id, changed_by, change_reason, previous_record, new_record
  )
  values (
    updated_agent.id, p_changed_by, 'update',
    to_jsonb(previous_agent), to_jsonb(updated_agent)
  );

  return jsonb_build_object(
    'status', 'ok',
    'previous', to_jsonb(previous_agent),
    'agent', to_jsonb(updated_agent)
  );
end;
$$;

revoke all on function public.admin_create_agent(jsonb, text) from public;
revoke all on function public.admin_update_agent(uuid, bigint, jsonb, text) from public;
grant execute on function public.admin_create_agent(jsonb, text) to service_role;
grant execute on function public.admin_update_agent(uuid, bigint, jsonb, text) to service_role;
