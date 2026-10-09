alter table public.agents
  add column if not exists setup_guide jsonb not null default '{}'::jsonb;

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

-- Seed only audited starter guides; preserve any guide already entered by an administrator.
update public.agents
set setup_guide = jsonb_build_object(
  'source_url', 'https://aider.chat/docs/install.html',
  'checked_at', '2026-10-06',
  'notes', 'The catalog release markers v0.86.0 and v0.86.1 conflict. This guide verifies the documented install path, not the catalog version.',
  'platforms', jsonb_build_object(
    'windows', jsonb_build_object(
      'support', 'supported',
      'install_route', 'Python package installer',
      'prerequisites', jsonb_build_array('Python 3.8 to 3.13. If needed, aider-install can install a separate Python 3.12 runtime.'),
      'install_commands', jsonb_build_array('python -m pip install aider-install', 'aider-install'),
      'provider_setup', 'Configure a supported model provider or local model using the provider and Aider documentation. Keep credentials out of the repository.',
      'first_run_steps', jsonb_build_array('Open PowerShell in the repository folder and start Aider.', 'At the prompt, describe the change and identify the files to edit, or use /add to select files.', 'Review the proposed changes; use /undo in Aider to revert its last change if needed.'),
      'first_run_commands', jsonb_build_array('aider')
    ),
    'macos', jsonb_build_object(
      'support', 'supported',
      'install_route', 'Python package installer',
      'prerequisites', jsonb_build_array('Python 3.8 to 3.13. If needed, aider-install can install a separate Python 3.12 runtime.'),
      'install_commands', jsonb_build_array('python -m pip install aider-install', 'aider-install'),
      'provider_setup', 'Configure a supported model provider or local model using the provider and Aider documentation. Keep credentials out of the repository.',
      'first_run_steps', jsonb_build_array('Open Terminal in the repository folder and start Aider.', 'At the prompt, describe the change and identify the files to edit, or use /add to select files.', 'Review the proposed changes; use /undo in Aider to revert its last change if needed.'),
      'first_run_commands', jsonb_build_array('aider')
    ),
    'linux', jsonb_build_object(
      'support', 'supported',
      'install_route', 'Python package installer',
      'prerequisites', jsonb_build_array('Python 3.8 to 3.13. If needed, aider-install can install a separate Python 3.12 runtime.'),
      'install_commands', jsonb_build_array('python -m pip install aider-install', 'aider-install'),
      'provider_setup', 'Configure a supported model provider or local model using the provider and Aider documentation. Keep credentials out of the repository.',
      'first_run_steps', jsonb_build_array('Open a terminal in the repository folder and start Aider.', 'At the prompt, describe the change and identify the files to edit, or use /add to select files.', 'Review the proposed changes; use /undo in Aider to revert its last change if needed.'),
      'first_run_commands', jsonb_build_array('aider')
    )
  )
)
where slug = 'aider' and setup_guide = '{}'::jsonb;

update public.agents
set setup_guide = jsonb_build_object(
  'source_url', 'https://geminicli.com/docs/get-started/installation/',
  'checked_at', '2026-10-06',
  'notes', 'The catalog lists v0.62.0; this source documents the stable npm channel and does not independently verify that catalog tag. Authentication options are documented at https://geminicli.com/docs/get-started/authentication/.',
  'platforms', jsonb_build_object(
    'windows', jsonb_build_object(
      'support', 'supported',
      'install_route', 'Global npm package',
      'prerequisites', jsonb_build_array('Windows 11 version 24H2 or newer.', 'Node.js 20 or newer and an internet connection.', '4 GB or more RAM for casual use; 16 GB or more for longer sessions and large projects.'),
      'install_commands', jsonb_build_array('npm install -g @google/gemini-cli'),
      'provider_setup', 'Start gemini and choose Google sign-in in the browser, use a Gemini API key, or configure Vertex AI. Organization and subscription accounts may need a Google Cloud project. Do not share or commit credentials.',
      'first_run_steps', jsonb_build_array('Open PowerShell in the project folder and run gemini.', 'Complete the selected sign-in or provider setup when prompted.', 'Review tool permissions and sandbox settings before allowing changes or commands.')
    ),
    'macos', jsonb_build_object(
      'support', 'supported',
      'install_route', 'Global npm package',
      'prerequisites', jsonb_build_array('macOS 15 or newer.', 'Node.js 20 or newer and an internet connection.', '4 GB or more RAM for casual use; 16 GB or more for longer sessions and large projects.'),
      'install_commands', jsonb_build_array('npm install -g @google/gemini-cli'),
      'provider_setup', 'Start gemini and choose Google sign-in in the browser, use a Gemini API key, or configure Vertex AI. Organization and subscription accounts may need a Google Cloud project. Do not share or commit credentials.',
      'first_run_steps', jsonb_build_array('Open Terminal in the project folder and run gemini.', 'Complete the selected sign-in or provider setup when prompted.', 'Review tool permissions and sandbox settings before allowing changes or commands.')
    ),
    'linux', jsonb_build_object(
      'support', 'supported',
      'install_route', 'Global npm package',
      'prerequisites', jsonb_build_array('Ubuntu 20.04 or newer is listed in the official system requirements.', 'Node.js 20 or newer and an internet connection.', '4 GB or more RAM for casual use; 16 GB or more for longer sessions and large projects.'),
      'install_commands', jsonb_build_array('npm install -g @google/gemini-cli'),
      'provider_setup', 'Start gemini and choose Google sign-in in the browser, use a Gemini API key, or configure Vertex AI. Organization and subscription accounts may need a Google Cloud project. Do not share or commit credentials.',
      'first_run_steps', jsonb_build_array('Open a terminal in the project folder and run gemini.', 'Complete the selected sign-in or provider setup when prompted.', 'Review tool permissions and sandbox settings before allowing changes or commands.')
    )
  )
)
where slug = 'gemini-cli' and setup_guide = '{}'::jsonb;

update public.agents
set setup_guide = jsonb_build_object(
  'source_url', 'https://github.com/debpalash/VoiceStudio/blob/main/docs/install/agent.md',
  'source_version', 'Main-branch install documentation',
  'checked_at', '2026-10-06',
  'notes', 'The catalog row lists v0.5.6; the cited main-branch install guide describes the Electron release process but does not verify that catalog release tag. Intel Macs provide the UI only; Windows on ARM remains experimental. Follow the linked OS guide and verify release checksums.',
  'platforms', jsonb_build_object(
    'windows', jsonb_build_object(
      'support', 'supported',
      'install_route', 'Windows installer or official PowerShell installer',
      'prerequisites', jsonb_build_array('Windows 10 or 11, x64. Windows on ARM is experimental.', 'About 10 GB of free disk space.'),
      'hardware_notes', 'An NVIDIA GPU is optional. The app can use CPU processing, which is slower.',
      'download_url', 'https://github.com/debpalash/VoiceStudio/releases/latest',
      'install_commands', jsonb_build_array('irm https://voicestudio.sh/install | iex'),
      'first_run_steps', jsonb_build_array('Open VoiceStudio and complete local backend setup.', 'Choose an engine and review the model size and license before downloading it.', 'Generate a short clip with a bundled or authorized voice and confirm the audio plays.'),
      'uninstall_steps', jsonb_build_array('Quit VoiceStudio.', 'Run the command to open the Electron uninstall wizard, then complete the wizard.', 'Settings, projects, backend environments, and models are preserved. Use the in-app data-removal confirmation before uninstalling if you also want to delete app data.'),
      'uninstall_commands', jsonb_build_array('Remove-Item Env:VOICESTUDIO_VERSION -ErrorAction SilentlyContinue; $env:VOICESTUDIO_INSTALL_MODE=''uninstall''; irm https://voicestudio.sh/install.ps1 | iex'),
      'data_retention', 'Settings, projects, backend environments, and models are preserved. Delete app data from inside VoiceStudio before uninstalling if desired.'
    ),
    'macos', jsonb_build_object(
      'support', 'supported',
      'install_route', 'Apple Silicon DMG or official shell installer',
      'prerequisites', jsonb_build_array('macOS 13.3 or newer on Apple Silicon. Intel Macs can run the UI only; the local backend is unsupported.', 'About 10 GB of free disk space.'),
      'hardware_notes', 'Apple Silicon uses Metal acceleration. Intel Macs need a remote backend for local voice processing.',
      'download_url', 'https://github.com/debpalash/VoiceStudio/releases/latest',
      'install_commands', jsonb_build_array('curl -fsSL https://voicestudio.sh/install | sh'),
      'first_run_steps', jsonb_build_array('Open VoiceStudio and complete local backend setup.', 'Choose an engine and review the model size and license before downloading it.', 'Generate a short clip with a bundled or authorized voice and confirm the audio plays.'),
      'uninstall_steps', jsonb_build_array('Quit VoiceStudio completely.', 'Run the uninstall command. The app is moved to Trash or a recovery location; check the printed path.', 'Settings, projects, backend environments, and models are preserved. Use the in-app data-removal confirmation before uninstalling if you also want to delete app data.'),
      'uninstall_commands', jsonb_build_array('curl -fsSL https://voicestudio.sh/install | sh -s -- --uninstall'),
      'data_retention', 'Settings, projects, backend environments, and models are preserved. Delete app data from inside VoiceStudio before uninstalling if desired.'
    ),
    'linux', jsonb_build_object(
      'support', 'supported',
      'install_route', 'Linux x86_64 AppImage or Debian/Ubuntu package',
      'prerequisites', jsonb_build_array('Linux x86_64 with a graphical desktop session. ARM64 Linux packages are not provided.', 'About 10 GB of free disk space.'),
      'hardware_notes', 'An NVIDIA GPU is optional. The app can use CPU processing, which is slower.',
      'download_url', 'https://github.com/debpalash/VoiceStudio/releases/latest',
      'install_commands', jsonb_build_array('curl -fsSL https://voicestudio.sh/install | sh'),
      'first_run_steps', jsonb_build_array('Open VoiceStudio and complete local backend setup.', 'Choose an engine and review the model size and license before downloading it.', 'Generate a short clip with a bundled or authorized voice and confirm the audio plays.'),
      'uninstall_steps', jsonb_build_array('Quit VoiceStudio.', 'If installed with the shell installer, run the uninstall command and check the printed recovery path. If installed as a .deb package, remove it with the package manager.', 'Settings, projects, backend environments, and models are preserved. Use the in-app data-removal confirmation before uninstalling if you also want to delete app data.'),
      'uninstall_commands', jsonb_build_array('curl -fsSL https://voicestudio.sh/install | sh -s -- --uninstall'),
      'data_retention', 'Settings, projects, backend environments, and models are preserved. Delete app data from inside VoiceStudio before uninstalling if desired.'
    )
  )
)
where slug = 'voicestudio' and setup_guide = '{}'::jsonb;

with audited_guides as (
  select value
  from jsonb_array_elements($guide_data$[
    {"slug":"skyvern","source_url":"https://github.com/Skyvern-AI/skyvern#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_commands":["pip install \"skyvern[all]\"","skyvern quickstart"]},"macos":{"support":"supported","install_commands":["pip install \"skyvern[all]\"","skyvern quickstart"]},"linux":{"support":"supported","install_commands":["pip install \"skyvern[all]\"","skyvern quickstart"]}}},
    {"slug":"browseros","source_url":"https://github.com/browseros-ai/BrowserOS#readme","checked_at":"2026-10-06","platforms":{"macos":{"support":"supported","install_commands":["brew tap browseros-ai/tap && brew install --cask browseros-neo"]},"windows":{"support":"supported"},"linux":{"support":"supported"}}},
    {"slug":"decepticon","source_url":"https://github.com/BitterSecurity/Decepticon#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_commands":["irm https://decepticon.red/install.ps1 | iex"]},"macos":{"support":"supported","install_commands":["curl -fsSL https://decepticon.red/install | bash"]},"linux":{"support":"supported","install_commands":["curl -fsSL https://decepticon.red/install | bash"]}}},
    {"slug":"pentest-swarm-ai","source_url":"https://github.com/Armur-Ai/Pentest-Swarm-AI#readme","checked_at":"2026-10-06","platforms":{"macos":{"support":"supported","install_commands":["curl -fsSL https://raw.githubusercontent.com/Armur-Ai/Pentest-Swarm-AI/main/scripts/install.sh | sh"]},"linux":{"support":"supported","install_commands":["curl -fsSL https://raw.githubusercontent.com/Armur-Ai/Pentest-Swarm-AI/main/scripts/install.sh | sh"]}}},
    {"slug":"skales","source_url":"https://github.com/skalesapp/skales#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported"},"macos":{"support":"supported"},"linux":{"support":"supported"}}},
    {"slug":"pentest-ai","source_url":"https://github.com/0xSteph/pentest-ai#readme","checked_at":"2026-10-06","platforms":{}},
    {"slug":"pentest-copilot","source_url":"https://github.com/bugbasesecurity/pentest-copilot/blob/main/docs/SETUP.md","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_route":"WSL2 only","install_commands":["git clone https://github.com/bugbasesecurity/pentest-copilot.git\ncd pentest-copilot\n./run.sh start"]},"macos":{"support":"supported","install_commands":["git clone https://github.com/bugbasesecurity/pentest-copilot.git\ncd pentest-copilot\n./run.sh start"]},"linux":{"support":"supported","install_commands":["git clone https://github.com/bugbasesecurity/pentest-copilot.git\ncd pentest-copilot\n./run.sh start"]}}},
    {"slug":"dark-moon","source_url":"https://github.com/ASCIT31/Dark-Moon/blob/main/docs/full.md","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_route":"WSL2 only","install_commands":["git clone https://github.com/ASCIT31/Dark-Moon.git\ncd Dark-Moon\n./install.sh"]},"linux":{"support":"supported","install_commands":["git clone https://github.com/ASCIT31/Dark-Moon.git\ncd Dark-Moon\n./install.sh"]}}},
    {"slug":"surf","source_url":"https://github.com/e2b-dev/surf#readme","checked_at":"2026-10-06","platforms":{}},
    {"slug":"opencode","source_url":"https://github.com/anomalyco/opencode#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_commands":["scoop install opencode","choco install opencode"]},"macos":{"support":"supported","install_commands":["brew install anomalyco/tap/opencode"]},"linux":{"support":"supported","install_commands":["brew install anomalyco/tap/opencode"]}}},
    {"slug":"claude-code","source_url":"https://github.com/anthropics/claude-code#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_commands":["irm https://claude.ai/install.ps1 | iex","winget install Anthropic.ClaudeCode"]},"macos":{"support":"supported","install_commands":["curl -fsSL https://claude.ai/install.sh | bash","brew install --cask claude-code"]},"linux":{"support":"supported","install_commands":["curl -fsSL https://claude.ai/install.sh | bash"]}}},
    {"slug":"codex","source_url":"https://github.com/openai/codex#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_commands":["powershell -ExecutionPolicy ByPass -c \"irm https://chatgpt.com/codex/install.ps1 | iex\""]},"macos":{"support":"supported","install_commands":["curl -fsSL https://chatgpt.com/codex/install.sh | sh"]},"linux":{"support":"supported","install_commands":["curl -fsSL https://chatgpt.com/codex/install.sh | sh"]}}},
    {"slug":"pi","source_url":"https://github.com/earendil-works/pi#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_commands":["powershell -c \"irm https://pi.dev/install.ps1 | iex\""]},"macos":{"support":"supported","install_commands":["curl -fsSL https://pi.dev/install.sh | sh"]},"linux":{"support":"supported","install_commands":["curl -fsSL https://pi.dev/install.sh | sh"]}}},
    {"slug":"gemini-cli","source_url":"https://github.com/google-gemini/gemini-cli#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"unknown"},"macos":{"support":"supported","install_commands":["brew install gemini-cli","sudo port install gemini-cli"]},"linux":{"support":"supported","install_commands":["brew install gemini-cli"]}}},
    {"slug":"openhands","source_url":"https://github.com/OpenHands/OpenHands#readme","checked_at":"2026-10-06","platforms":{}},
    {"slug":"cline","source_url":"https://github.com/cline/cline#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported"},"macos":{"support":"supported"}}},
    {"slug":"openinterpreter","source_url":"https://github.com/openinterpreter/openinterpreter#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_commands":["irm https://www.openinterpreter.com/install.ps1 | iex"]},"macos":{"support":"supported","install_commands":["curl -fsSL https://www.openinterpreter.com/install | sh"]},"linux":{"support":"supported","install_commands":["curl -fsSL https://www.openinterpreter.com/install | sh"]}}},
    {"slug":"goose","source_url":"https://goose-docs.ai/docs/getting-started/installation/","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_route":"Git Bash or MSYS2","install_commands":["curl -fsSL https://github.com/aaif-goose/goose/releases/download/stable/download_cli.sh | bash"]},"macos":{"support":"supported","install_commands":["curl -fsSL https://github.com/aaif-goose/goose/releases/download/stable/download_cli.sh | bash"]},"linux":{"support":"supported","install_commands":["curl -fsSL https://github.com/aaif-goose/goose/releases/download/stable/download_cli.sh | bash"]}}},
    {"slug":"aider","source_url":"https://aider.chat/docs/install.html","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_commands":["powershell -ExecutionPolicy ByPass -c \"irm https://aider.chat/install.ps1 | iex\""]},"macos":{"support":"supported","install_commands":["curl -LsSf https://aider.chat/install.sh | sh"]},"linux":{"support":"supported","install_commands":["curl -LsSf https://aider.chat/install.sh | sh"]}}},
    {"slug":"codewhale","source_url":"https://github.com/Hmbown/Codewhale#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_commands":["winget install HunterBown.CodeWhale"]},"macos":{"support":"supported","install_commands":["curl -fsSL https://codewhale.net/install.sh | sh"]},"linux":{"support":"supported","install_commands":["curl -fsSL https://codewhale.net/install.sh | sh"]}}},
    {"slug":"oh-my-pi","source_url":"https://github.com/can1357/oh-my-pi#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_commands":["irm https://omp.sh/install.ps1 | iex"]},"macos":{"support":"supported","install_commands":["curl -fsSL https://omp.sh/install | sh"]},"linux":{"support":"supported","install_commands":["curl -fsSL https://omp.sh/install | sh"]}}},
    {"slug":"qwen-code","source_url":"https://github.com/QwenLM/qwen-code#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_commands":["irm https://qwen-code-assets.oss-cn-hangzhou.aliyuncs.com/installation/install-qwen-standalone.ps1 | iex"]},"macos":{"support":"supported","install_commands":["curl -fsSL https://qwen-code-assets.oss-cn-hangzhou.aliyuncs.com/installation/install-qwen-standalone.sh | bash"]},"linux":{"support":"supported","install_commands":["curl -fsSL https://qwen-code-assets.oss-cn-hangzhou.aliyuncs.com/installation/install-qwen-standalone.sh | bash"]}}},
    {"slug":"crush","source_url":"https://github.com/charmbracelet/crush#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_commands":["winget install charmbracelet.crush","scoop bucket add charm https://github.com/charmbracelet/scoop-bucket.git; scoop install crush"]},"linux":{"support":"supported","install_commands":["yay -S crush-bin"]}}},
    {"slug":"kilocode","source_url":"https://github.com/Kilo-Org/kilocode#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported"},"macos":{"support":"supported","install_commands":["brew install Kilo-Org/tap/kilo"]},"linux":{"support":"supported","install_commands":["brew install Kilo-Org/tap/kilo"]}}},
    {"slug":"codebuff","source_url":"https://github.com/CodebuffAI/freebuff#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported"},"macos":{"support":"supported"},"linux":{"support":"supported"}}},
    {"slug":"copilot-cli","source_url":"https://github.com/github/copilot-cli#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_commands":["winget install GitHub.Copilot"]},"macos":{"support":"supported","install_commands":["curl -fsSL https://gh.io/copilot-install | bash"]},"linux":{"support":"supported","install_commands":["curl -fsSL https://gh.io/copilot-install | bash"]}}},
    {"slug":"mini-swe-agent","source_url":"https://github.com/SWE-agent/mini-swe-agent#readme","checked_at":"2026-10-06","platforms":{}},
    {"slug":"kimi-code","source_url":"https://github.com/MoonshotAI/kimi-code#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_commands":["irm https://code.kimi.com/kimi-code/install.ps1 | iex"]},"macos":{"support":"supported","install_commands":["curl -fsSL https://code.kimi.com/kimi-code/install.sh | bash"]},"linux":{"support":"supported","install_commands":["curl -fsSL https://code.kimi.com/kimi-code/install.sh | bash"]}}},
    {"slug":"mistral-vibe","source_url":"https://github.com/mistralai/mistral-vibe#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_commands":["powershell -ExecutionPolicy ByPass -c \"irm https://astral.sh/uv/install.ps1 | iex\"\nuv tool install mistral-vibe"]},"macos":{"support":"supported","install_commands":["curl -LsSf https://mistral.ai/vibe/install.sh | bash"]},"linux":{"support":"supported","install_commands":["curl -LsSf https://mistral.ai/vibe/install.sh | bash"]}}},
    {"slug":"gptme","source_url":"https://github.com/gptme/gptme#readme","checked_at":"2026-10-06","platforms":{}},
    {"slug":"command-code","source_url":"https://github.com/CommandCodeAI/command-code#readme","checked_at":"2026-10-06","platforms":{}},
    {"slug":"pydantic-deepagents","source_url":"https://github.com/vstorm-co/pydantic-deepagents#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_commands":["pip install \"pydantic-deep[cli]\""]},"macos":{"support":"supported","install_commands":["curl -fsSL https://raw.githubusercontent.com/vstorm-co/pydantic-deepagents/main/install.sh | bash"]},"linux":{"support":"supported","install_commands":["curl -fsSL https://raw.githubusercontent.com/vstorm-co/pydantic-deepagents/main/install.sh | bash"]}}},
    {"slug":"gpt-researcher","source_url":"https://github.com/assafelovic/gpt-researcher#readme","checked_at":"2026-10-06","platforms":{}},
    {"slug":"dexter","source_url":"https://github.com/virattt/dexter#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_commands":["powershell -c \"irm bun.sh/install.ps1|iex\"\ngit clone https://github.com/virattt/dexter.git\ncd dexter\nbun install"]},"macos":{"support":"supported","install_commands":["curl -fsSL https://bun.com/install | bash\ngit clone https://github.com/virattt/dexter.git\ncd dexter\nbun install"]},"linux":{"support":"supported","install_commands":["curl -fsSL https://bun.com/install | bash\ngit clone https://github.com/virattt/dexter.git\ncd dexter\nbun install"]}}},
    {"slug":"db-gpt","source_url":"https://github.com/eosphoros-ai/DB-GPT#readme","checked_at":"2026-10-06","platforms":{"macos":{"support":"supported","install_commands":["curl -fsSL https://raw.githubusercontent.com/eosphoros-ai/DB-GPT/main/scripts/install/install.sh | bash"]},"linux":{"support":"supported","install_commands":["curl -fsSL https://raw.githubusercontent.com/eosphoros-ai/DB-GPT/main/scripts/install/install.sh | bash"]}}},
    {"slug":"deep-research","source_url":"https://github.com/dzhng/deep-research#readme","checked_at":"2026-10-06","platforms":{}},
    {"slug":"paperqa","source_url":"https://github.com/Future-House/paper-qa#readme","checked_at":"2026-10-06","platforms":{}},
    {"slug":"deep-research-web-ui","source_url":"https://github.com/AnotiaWang/deep-research-web-ui#readme","checked_at":"2026-10-06","platforms":{}},
    {"slug":"open-webui","source_url":"https://github.com/open-webui/open-webui#readme","checked_at":"2026-10-06","platforms":{}},
    {"slug":"ragflow","source_url":"https://github.com/infiniflow/ragflow#readme","checked_at":"2026-10-06","platforms":{"macos":{"support":"supported","install_commands":["git clone https://github.com/infiniflow/ragflow.git\ncd ragflow/docker\ngit checkout v1.0.0-rc1\ndocker compose -f docker-compose.yml up -d"]},"linux":{"support":"supported","install_commands":["git clone https://github.com/infiniflow/ragflow.git\ncd ragflow/docker\ngit checkout v1.0.0-rc1\ndocker compose -f docker-compose.yml up -d"]}}},
    {"slug":"lobehub","source_url":"https://github.com/lobehub/lobehub#readme","checked_at":"2026-10-06","platforms":{}},
    {"slug":"anything-llm","source_url":"https://github.com/Mintplex-Labs/anything-llm/blob/master/docker/HOW_TO_USE_DOCKER.md","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_commands":["$env:STORAGE_LOCATION=\"$HOME\\Documents\\anythingllm\";\nif (!(Test-Path $env:STORAGE_LOCATION)) { New-Item $env:STORAGE_LOCATION -ItemType Directory };\nif (!(Test-Path \"$env:STORAGE_LOCATION\\.env\")) { New-Item \"$env:STORAGE_LOCATION\\.env\" -ItemType File };\ndocker run -d --rm -p 3001:3001 --cap-add SYS_ADMIN -v \"$env:STORAGE_LOCATION`:/app/server/storage\" -v \"$env:STORAGE_LOCATION\\.env:/app/server/.env\" -e STORAGE_DIR=\"/app/server/storage\" mintplexlabs/anythingllm"]},"macos":{"support":"supported","install_commands":["export STORAGE_LOCATION=$HOME/anythingllm && mkdir -p $STORAGE_LOCATION && touch \"$STORAGE_LOCATION/.env\" && docker run -d --rm -p 3001:3001 --cap-add SYS_ADMIN -v ${STORAGE_LOCATION}:/app/server/storage -v ${STORAGE_LOCATION}/.env:/app/server/.env -e STORAGE_DIR=\"/app/server/storage\" mintplexlabs/anythingllm"]},"linux":{"support":"supported","install_commands":["export STORAGE_LOCATION=$HOME/anythingllm && mkdir -p $STORAGE_LOCATION && touch \"$STORAGE_LOCATION/.env\" && docker run -d --rm -p 3001:3001 --cap-add SYS_ADMIN -v ${STORAGE_LOCATION}:/app/server/storage -v ${STORAGE_LOCATION}/.env:/app/server/.env -e STORAGE_DIR=\"/app/server/storage\" mintplexlabs/anythingllm"]}}},
    {"slug":"cherry-studio","source_url":"https://github.com/CherryHQ/cherry-studio#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported"},"macos":{"support":"supported"},"linux":{"support":"supported"}}},
    {"slug":"librechat","source_url":"https://github.com/LibreChat-AI/LibreChat#readme","checked_at":"2026-10-06","platforms":{}},
    {"slug":"open-notebook","source_url":"https://github.com/lfnovo/open-notebook#readme","checked_at":"2026-10-06","platforms":{"macos":{"support":"supported","install_commands":["mkdir open-notebook && cd open-notebook\ncurl -o docker-compose.yml https://raw.githubusercontent.com/lfnovo/open-notebook/main/docker-compose.yml\ndocker compose up -d"]},"linux":{"support":"supported","install_commands":["mkdir open-notebook && cd open-notebook\ncurl -o docker-compose.yml https://raw.githubusercontent.com/lfnovo/open-notebook/main/docker-compose.yml\ndocker compose up -d"]}}},
    {"slug":"langchain-chatchat","source_url":"https://github.com/chatchat-space/Langchain-Chatchat#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_commands":["pip install langchain-chatchat -U"]},"macos":{"support":"supported","install_commands":["pip install langchain-chatchat -U"]},"linux":{"support":"supported","install_commands":["pip install langchain-chatchat -U"]}}},
    {"slug":"khoj","source_url":"https://docs.khoj.dev/get-started/setup","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_commands":["py -m pip install 'khoj[local]'"]},"macos":{"support":"supported","install_commands":["CMAKE_ARGS=\"-DGGML_METAL=on\" python -m pip install 'khoj[local]'"]},"linux":{"support":"supported","install_commands":["python -m pip install 'khoj[local]'"]}}},
    {"slug":"onyx","source_url":"https://github.com/onyx-dot-app/onyx#readme","checked_at":"2026-10-06","platforms":{}},
    {"slug":"maxkb","source_url":"https://github.com/1Panel-dev/MaxKB#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_commands":["docker run -d --name=maxkb --restart=always -p 8080:8080 -v C:/maxkb:/var/lib/postgresql/data -v C:/python-packages:/opt/maxkb/app/sandbox/python-packages registry.fit2cloud.com/maxkb/maxkb"]},"linux":{"support":"supported","install_commands":["docker run -d --name=maxkb --restart=always -p 8080:8080 -v ~/.maxkb:/var/lib/postgresql/data -v ~/.python-packages:/opt/maxkb/app/sandbox/python-packages registry.fit2cloud.com/maxkb/maxkb"]}}},
    {"slug":"docsgpt","source_url":"https://github.com/arc53/DocsGPT#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_commands":["irm https://docs.ac/install.ps1 | iex"]},"macos":{"support":"supported","install_commands":["curl -fsSL https://docs.ac/install | bash"]},"linux":{"support":"supported","install_commands":["curl -fsSL https://docs.ac/install | bash"]}}},
    {"slug":"surfsense","source_url":"https://github.com/MODSetter/SurfSense#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported"},"macos":{"support":"supported"},"linux":{"support":"supported"}}},
    {"slug":"notebookllama","source_url":"https://github.com/run-llama/notebookllama#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_commands":["powershell -ExecutionPolicy ByPass -c \"irm https://astral.sh/uv/install.ps1 | iex\"\ngit clone https://github.com/run-llama/notebookllama\ncd notebookllama\nuv sync"]},"macos":{"support":"supported","install_commands":["curl -LsSf https://astral.sh/uv/install.sh | sh\ngit clone https://github.com/run-llama/notebookllama\ncd notebookllama\nuv sync"]},"linux":{"support":"supported","install_commands":["curl -LsSf https://astral.sh/uv/install.sh | sh\ngit clone https://github.com/run-llama/notebookllama\ncd notebookllama\nuv sync"]}}},
    {"slug":"insights-lm-public","source_url":"https://github.com/theaiautomators/insights-lm-public#readme","checked_at":"2026-10-06","platforms":{}},
    {"slug":"comfyui","source_url":"https://github.com/Comfy-Org/ComfyUI#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_commands":["pip install comfy-cli\ncomfy install"]},"linux":{"support":"supported","install_commands":["pip install comfy-cli\ncomfy install"]}}},
    {"slug":"open-generative-ai","source_url":"https://github.com/Anil-matcha/Open-Generative-AI#readme","checked_at":"2026-10-06","platforms":{"linux":{"support":"supported","install_commands":["sudo apt install ./release/open-generative-ai_*_amd64.deb"]}}},
    {"slug":"invokeai","source_url":"https://github.com/invoke-ai/InvokeAI#readme","checked_at":"2026-10-06","platforms":{}},
    {"slug":"kotaemon","source_url":"https://github.com/Cinnamon/kotaemon/blob/main/docs/index.md","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_commands":["cd scripts\n.\\run_windows.bat"]},"linux":{"support":"supported","install_commands":["cd scripts\nbash run_linux.sh"]}}},
    {"slug":"node-banana","source_url":"https://github.com/shrimbly/node-banana#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_commands":["git clone https://github.com/shrimbly/node-banana.git\ncd node-banana\nnpm install\nnpm run dev"]},"macos":{"support":"supported"}}},
    {"slug":"vibe-workflow","source_url":"https://github.com/SamurAIGPT/Vibe-Workflow#readme","checked_at":"2026-10-06","platforms":{}},
    {"slug":"moneyprinterturbo","source_url":"https://github.com/harry0703/MoneyPrinterTurbo#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_commands":["git clone https://github.com/harry0703/MoneyPrinterTurbo.git","cd MoneyPrinterTurbo","uv python install 3.11","uv sync --frozen"]},"macos":{"support":"supported","install_commands":["git clone https://github.com/harry0703/MoneyPrinterTurbo.git","cd MoneyPrinterTurbo","uv python install 3.11","uv sync --frozen"]},"linux":{"support":"supported","install_commands":["git clone https://github.com/harry0703/MoneyPrinterTurbo.git","cd MoneyPrinterTurbo","uv python install 3.11","uv sync --frozen"]}}},
    {"slug":"voicestudio","source_url":"https://github.com/debpalash/VoiceStudio#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_commands":["irm https://voicestudio.sh/install | iex"]},"macos":{"support":"supported","install_commands":["curl -fsSL https://voicestudio.sh/install | sh"],"uninstall_commands":["curl -fsSL https://voicestudio.sh/install | sh -s -- --uninstall"]},"linux":{"support":"supported","install_commands":["curl -fsSL https://voicestudio.sh/install | sh"],"uninstall_commands":["curl -fsSL https://voicestudio.sh/install | sh -s -- --uninstall"]}}},
    {"slug":"pyvideotrans","source_url":"https://github.com/jianchang512/pyvideotrans#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_commands":["git clone https://github.com/jianchang512/pyvideotrans.git\ncd pyvideotrans\nuv sync"]},"macos":{"support":"supported","install_commands":["git clone https://github.com/jianchang512/pyvideotrans.git\ncd pyvideotrans\nuv sync"]},"linux":{"support":"supported","install_commands":["git clone https://github.com/jianchang512/pyvideotrans.git\ncd pyvideotrans\nuv sync"]}}},
    {"slug":"videolingo","source_url":"https://github.com/Huanshere/VideoLingo#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_commands":["git clone https://github.com/Huanshere/VideoLingo.git\ncd VideoLingo\nuv run start.py"]},"macos":{"support":"supported","install_commands":["git clone https://github.com/Huanshere/VideoLingo.git\ncd VideoLingo\nuv run start.py"]},"linux":{"support":"supported","install_commands":["git clone https://github.com/Huanshere/VideoLingo.git\ncd VideoLingo\nuv run start.py"]}}},
    {"slug":"toonflow-app","source_url":"https://github.com/HBAI-Ltd/Toonflow-app#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_commands":["git clone https://github.com/HBAI-Ltd/Toonflow-app.git\ncd Toonflow-app\ndocker compose up -d --build"]},"macos":{"support":"supported","install_commands":["git clone https://github.com/HBAI-Ltd/Toonflow-app.git\ncd Toonflow-app\ndocker compose up -d --build"]},"linux":{"support":"supported","install_commands":["sudo apt-get update\nsudo apt-get install -y git curl unzip ffmpeg\ncurl -fsSL https://bun.com/install | bash -s \"bun-v1.3.14\"\nexport PATH=\"$HOME/.bun/bin:$PATH\"\nbun --version\ngit clone https://github.com/HBAI-Ltd/Toonflow-app.git\ncd Toonflow-app\nbun install --frozen-lockfile\nbun run build:server\nmkdir -p data/workspaces/myProject\nbun run start:server"]}}},
    {"slug":"voice-pro","source_url":"https://github.com/abus-aikorea/voice-pro#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_commands":["start.bat"],"uninstall_commands":["uninstall.bat"]}}},
    {"slug":"opencreator","source_url":"https://github.com/krillinai/OpenCreator#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported"},"macos":{"support":"supported"}}},
    {"slug":"youdub-webui","source_url":"https://github.com/liuzhao1225/YouDub-webui#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported","install_commands":["git clone https://github.com/liuzhao1225/YouDub-webui.git\ncd YouDub-webui\ngit submodule update --init --recursive\npy -3.12 -m venv .venv\n.\\.venv\\Scripts\\pip.exe install -i https://mirrors.aliyun.com/pypi/simple/ -r requirements.txt\ncd apps/web\nnpm ci --registry=https://registry.npmmirror.com"]},"macos":{"support":"supported","install_commands":["git clone https://github.com/liuzhao1225/YouDub-webui.git && cd YouDub-webui && git submodule update --init --recursive && python3.12 -m venv .venv && .venv/bin/pip install -i https://mirrors.aliyun.com/pypi/simple/ -r requirements.txt && (cd apps/web && npm ci --registry=https://registry.npmmirror.com)"]},"linux":{"support":"supported","install_commands":["git clone https://github.com/liuzhao1225/YouDub-webui.git && cd YouDub-webui && git submodule update --init --recursive && python3.12 -m venv .venv && .venv/bin/pip install -i https://mirrors.aliyun.com/pypi/simple/ -r requirements.txt && (cd apps/web && npm ci --registry=https://registry.npmmirror.com)"]}}},
    {"slug":"smartsub","source_url":"https://github.com/buxuku/SmartSub#readme","checked_at":"2026-10-06","platforms":{"windows":{"support":"supported"},"macos":{"support":"supported","install_commands":["brew tap buxuku/tap && brew install --cask smartsub"]},"linux":{"support":"supported"}}},
    {"slug":"sonitranslate","source_url":"https://github.com/R3gm/SoniTranslate#readme","checked_at":"2026-10-06","platforms":{"linux":{"support":"supported","install_commands":["conda create -n sonitr python=3.10 -y\nconda activate sonitr\nconda install pytorch==2.5.1 torchvision==0.20.1 torchaudio==2.5.1 pytorch-cuda=11.8 -c pytorch -c nvidia\ngit clone https://github.com/R3gm/SoniTranslate.git\npip install -r requirements_base.txt -v\npip install -r requirements_extra.txt -v\npip install onnxruntime-gpu"],"uninstall_commands":["conda deactivate\nconda env remove -n sonitr"]}}},
    {"slug":"swe-agent","source_url":"https://github.com/SWE-agent/SWE-agent#readme","checked_at":"2026-10-06","platforms":{}},
    {"slug":"pr-agent","source_url":"https://github.com/the-pr-agent/pr-agent#readme","checked_at":"2026-10-06","platforms":{}}
  ]$guide_data$::jsonb) as item(value)
)
update public.agents as agent
set setup_guide = jsonb_build_object(
  'source_url', item.value->'source_url',
  'checked_at', item.value->'checked_at',
  'platforms', item.value->'platforms'
)
from audited_guides as item
where agent.slug = item.value->>'slug'
  and (
    agent.setup_guide = '{}'::jsonb
    or (agent.slug = 'aider' and agent.setup_guide->>'source_url' = 'https://aider.chat/docs/install.html')
    or (agent.slug = 'gemini-cli' and agent.setup_guide->>'source_url' = 'https://geminicli.com/docs/get-started/installation/')
    or (agent.slug = 'voicestudio' and agent.setup_guide->>'source_url' = 'https://github.com/debpalash/VoiceStudio/blob/main/docs/install/agent.md')
  );
