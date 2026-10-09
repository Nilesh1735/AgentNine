import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { getSupabaseAdminServer } from "@/lib/supabase";
import { jsonBodyError, readJsonBody } from "@/lib/request-security";
import { invalidateCatalogAgents } from "@/lib/catalog-cache";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const commitSha = /^[0-9a-f]{7,40}$/i;
const checks = ["pinned_checkout_passed", "dependency_install_passed", "provider_setup_passed", "first_prompt_passed", "normal_machine_run_passed"];

function getChecklist(input: Record<string, unknown>) {
  const checklist: Record<string, boolean> = {};
  for (const key of checks) checklist[key] = input[key] === true;
  return checklist;
}

export async function POST(request: NextRequest) {
  if (!await isAdminRequest(request, true)) return NextResponse.json({ error: "Unauthorized or invalid CSRF token" }, { status: 403 });
  let input: Record<string, unknown>;
  try {
    const parsed = await readJsonBody<unknown>(request, 16 * 1024);
    if (!parsed.ok) return NextResponse.json(jsonBodyError(parsed), { status: parsed.status });
    if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) throw new Error();
    input = parsed.value as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid verification" }, { status: 400 });
  }
  if (typeof input.agent_id !== "string" || !uuid.test(input.agent_id) || typeof input.checked_version !== "string" || !input.checked_version.trim() || input.checked_version.length > 200) return NextResponse.json({ error: "Invalid verification" }, { status: 400 });
  const sourceCommitSha = typeof input.source_commit_sha === "string" ? input.source_commit_sha.trim() : "";
  if (sourceCommitSha && !commitSha.test(sourceCommitSha)) return NextResponse.json({ error: "Invalid source commit SHA" }, { status: 400 });
  const row: Record<string, unknown> = {
    agent_id: input.agent_id,
    checked_version: input.checked_version,
    source_commit_sha: sourceCommitSha || null,
    notes: typeof input.notes === "string" ? input.notes.slice(0, 4000) : null,
    verified_operating_systems: Array.isArray(input.verified_operating_systems)
      ? input.verified_operating_systems.filter((item): item is string => typeof item === "string").slice(0, 6)
      : [],
    verified_install_command: typeof input.verified_install_command === "string" ? input.verified_install_command.slice(0, 1000) : null,
    verified_first_task: typeof input.verified_first_task === "string" ? input.verified_first_task.slice(0, 1000) : null,
    verification_failure_conditions: typeof input.verification_failure_conditions === "string" ? input.verification_failure_conditions.slice(0, 2000) : null,
    checked_by: "admin",
  };
  Object.assign(row, getChecklist(input));
  if (checks.some((key) => row[key] === true) && (typeof row.notes !== "string" || !row.notes.trim())) return NextResponse.json({ error: "Evidence notes are required for completed checks" }, { status: 400 });
  const db = getSupabaseAdminServer();
  if (!db) return NextResponse.json({ error: "Admin data access is unavailable" }, { status: 503 });
  const { data, error } = await db.from("agent_verifications").insert(row).select("*").single();
  if (error || !data) return NextResponse.json({ error: "Unable to save verification" }, { status: 503 });

  const score = checks.reduce((total, key) => total + (data[key] === true ? 1 : 0), 0);
  invalidateCatalogAgents();
  return NextResponse.json({ ...data, verification_score: score }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  if (!await isAdminRequest(request, true)) return NextResponse.json({ error: "Unauthorized or invalid CSRF token" }, { status: 403 });
  let input: Record<string, unknown>;
  try {
    const parsed = await readJsonBody<unknown>(request, 128 * 1024);
    if (!parsed.ok) return NextResponse.json(jsonBodyError(parsed), { status: parsed.status });
    if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) throw new Error();
    input = parsed.value as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid bulk verification" }, { status: 400 });
  }
  const agentIds = Array.isArray(input.agent_ids) ? input.agent_ids : [];
  if (!agentIds.length || agentIds.length > 500 || agentIds.some((id) => typeof id !== "string" || !uuid.test(id))) {
    return NextResponse.json({ error: "Select at least one valid agent." }, { status: 400 });
  }
  const notes = typeof input.notes === "string" ? input.notes.slice(0, 4000).trim() : "";
  const sourceCommitSha = typeof input.source_commit_sha === "string" ? input.source_commit_sha.trim() : "";
  if (sourceCommitSha && !commitSha.test(sourceCommitSha)) return NextResponse.json({ error: "Invalid source commit SHA" }, { status: 400 });
  const checklist = getChecklist(input);
  if (!Object.values(checklist).some(Boolean) || !notes) {
    return NextResponse.json({ error: "Select at least one check and provide evidence notes." }, { status: 400 });
  }
  const db = getSupabaseAdminServer();
  if (!db) return NextResponse.json({ error: "Admin data access is unavailable" }, { status: 503 });

  const uniqueIds = [...new Set(agentIds as string[])];
  const { data: agents, error: loadError } = await db.from("agents").select("id, version_tag").in("id", uniqueIds);
  if (loadError) return NextResponse.json({ error: "Unable to load agents for bulk verification" }, { status: 503 });
  if (!agents || agents.length !== uniqueIds.length) return NextResponse.json({ error: "One or more selected agents could not be found." }, { status: 404 });
  if (agents.some((agent) => typeof agent.version_tag !== "string" || !agent.version_tag.trim())) {
    return NextResponse.json({ error: "Every selected agent needs a version tag before bulk verification." }, { status: 400 });
  }

  const checkedAt = new Date().toISOString();
  const rows = agents.map((agent) => ({
    agent_id: agent.id,
    checked_version: agent.version_tag.trim(),
    source_commit_sha: sourceCommitSha || null,
    notes,
    checked_by: "admin",
    checked_at: checkedAt,
    ...checklist,
  }));
  const { error: insertError } = await db.from("agent_verifications").insert(rows);
  if (insertError) return NextResponse.json({ error: "Bulk verification could not be saved; no agent scores were changed." }, { status: 503 });

  const score = checks.reduce((total, key) => total + (checklist[key] ? 1 : 0), 0);
  invalidateCatalogAgents();
  return NextResponse.json({ updated: uniqueIds.length, verification_score: score }, { status: 200 });
}
