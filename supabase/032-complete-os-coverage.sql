begin;

with requested_updates as (
  select value
  from jsonb_array_elements($platform_updates$[
    {"slug":"gemini-cli","os":"windows","platform":{"support":"supported","install_route":"Global npm package; Windows 11 24H2 or newer and Node.js 20 or newer","prerequisites":["Windows 11 24H2 or newer","Node.js 20.0.0 or newer"],"install_commands":["npm install -g @google/gemini-cli"],"first_run_commands":["gemini"]}},
    {"slug":"crush","os":"macos","platform":{"support":"supported","install_route":"Homebrew package","prerequisites":["Homebrew"],"install_commands":["brew install charmbracelet/tap/crush"],"first_run_commands":["crush"]}},
    {"slug":"comfyui","os":"macos","platform":{"support":"supported","install_route":"Official macOS desktop installer","download_url":"https://www.comfy.org/download"}},
    {"slug":"pentest-swarm-ai","os":"windows","platform":{"support":"unknown","install_route":"No verified Windows install route in the catalog."}},
    {"slug":"dark-moon","os":"macos","platform":{"support":"unknown","install_route":"No verified macOS install route in the catalog."}},
    {"slug":"db-gpt","os":"windows","platform":{"support":"unknown","install_route":"No verified Windows install route in the catalog."}},
    {"slug":"ragflow","os":"windows","platform":{"support":"unknown","install_route":"No verified Windows install route in the catalog."}},
    {"slug":"open-notebook","os":"windows","platform":{"support":"unknown","install_route":"No verified Windows install route in the catalog."}},
    {"slug":"maxkb","os":"macos","platform":{"support":"unknown","install_route":"No verified macOS install route in the catalog."}},
    {"slug":"open-generative-ai","os":"windows","platform":{"support":"unknown","install_route":"No verified Windows install route in the catalog."}},
    {"slug":"open-generative-ai","os":"macos","platform":{"support":"unknown","install_route":"No verified macOS install route in the catalog."}},
    {"slug":"kotaemon","os":"macos","platform":{"support":"unknown","install_route":"No verified macOS install route in the catalog."}},
    {"slug":"node-banana","os":"linux","platform":{"support":"unknown","install_route":"No verified Linux install route in the catalog."}},
    {"slug":"voice-pro","os":"macos","platform":{"support":"unknown","install_route":"No verified macOS install route in the catalog."}},
    {"slug":"voice-pro","os":"linux","platform":{"support":"unknown","install_route":"No verified Linux install route in the catalog."}},
    {"slug":"opencreator","os":"linux","platform":{"support":"unknown","install_route":"No verified Linux install route in the catalog."}},
    {"slug":"sonitranslate","os":"windows","platform":{"support":"unknown","install_route":"No verified Windows install route in the catalog."}},
    {"slug":"sonitranslate","os":"macos","platform":{"support":"unknown","install_route":"No verified macOS install route in the catalog."}}
  ]$platform_updates$::jsonb) as item(value)
),
eligible_updates as (
  select
    agent.id,
    requested_updates.value->>'os' as operating_system,
    requested_updates.value->'platform' as platform
  from requested_updates
  join public.agents as agent
    on agent.slug = requested_updates.value->>'slug'
  left join lateral (
    select agent.setup_guide->'platforms'->(requested_updates.value->>'os') as value
  ) as existing_platform on true
  where existing_platform.value is null
    or existing_platform.value = '{"support":"unknown"}'::jsonb
),
platform_updates as (
  select
    id,
    jsonb_object_agg(operating_system, platform) as platforms
  from eligible_updates
  group by id
)
update public.agents as agent
set setup_guide = jsonb_set(
  coalesce(agent.setup_guide, '{}'::jsonb),
  '{platforms}',
  coalesce(agent.setup_guide->'platforms', '{}'::jsonb) || platform_updates.platforms,
  true
)
from platform_updates
where agent.id = platform_updates.id;

with source_updates(slug, previous_source, verified_source) as (
  values
    (
      'gemini-cli',
      'https://github.com/google-gemini/gemini-cli#readme',
      'https://geminicli.com/docs/get-started/installation/'
    ),
    (
      'crush',
      'https://github.com/charmbracelet/crush#readme',
      'https://github.com/charmbracelet/crush#readme'
    ),
    (
      'comfyui',
      'https://github.com/Comfy-Org/ComfyUI#readme',
      'https://github.com/Comfy-Org/ComfyUI#readme'
    )
)
update public.agents as agent
set setup_guide = jsonb_set(
  jsonb_set(
    coalesce(agent.setup_guide, '{}'::jsonb),
    '{source_url}',
    to_jsonb(source_updates.verified_source),
    true
  ),
  '{checked_at}',
  to_jsonb('2026-10-08'::text),
  true
)
from source_updates
where agent.slug = source_updates.slug
  and agent.setup_guide->>'source_url' = source_updates.previous_source;

update public.agents
set setup_guide = jsonb_set(
  setup_guide,
  '{platforms,windows,first_run_commands}',
  '["command-code"]'::jsonb,
  true
)
where slug = 'command-code'
  and setup_guide->>'source_url' = 'https://github.com/CommandCodeAI/command-code#readme'
  and setup_guide #> '{platforms,windows,first_run_commands}' = '["cmd"]'::jsonb;

commit;
