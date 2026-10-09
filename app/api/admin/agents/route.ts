import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { getSupabaseAdminServer } from "@/lib/supabase";
import { jsonBodyError, readJsonBody } from "@/lib/request-security";
import { invalidateCatalogAgents } from "@/lib/catalog-cache";
import { validateSetupGuide } from "@/lib/setup-guide";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fields = ["name", "slug", "short_description", "category_id", "tags", "github_url", "version_tag", "os_commands", "setup_guide", "env_template", "common_errors", "hardware_requirements", "port_mapping", "memory_location", "network_access", "file_access", "uninstall_command", "first_launch_prompt", "cost_to_run", "requires_api_key", "is_flagship", "status", "last_verified_date", "stars", "last_commit_at", "is_archived", "setup_steps"];
const errorResponse = (error: string, status: number) => NextResponse.json({ error }, { status });

function clean(input: Record<string, unknown>) {
  const result: Record<string, unknown> = {};
  for (const field of fields) if (field in input) result[field] = input[field];
  if (typeof result.name !== "string" || result.name.length < 1 || result.name.length > 160) throw new Error("Invalid name");
  if (typeof result.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result.slug)) throw new Error("Invalid slug");
  if (typeof result.github_url !== "string") throw new Error("A GitHub source URL is required");
  try {
    const source = new URL(result.github_url);
    const parts = source.pathname.split("/").filter(Boolean);
    if (source.protocol !== "https:" || source.hostname !== "github.com" || source.username || source.password || parts.length !== 2) throw new Error();
    result.github_url = `https://github.com/${parts[0]}/${parts[1]}`;
  } catch {
    throw new Error("Invalid GitHub source URL");
  }
  if (result.status !== undefined && !["draft", "published", "archived", "needs_review"].includes(String(result.status))) throw new Error("Invalid status");
  if (result.status !== undefined) result.is_archived = result.status === "archived";
  else if (result.is_archived !== undefined && typeof result.is_archived !== "boolean") throw new Error("Invalid archive state");
  if (result.os_commands !== undefined && result.os_commands !== null) {
    if (!result.os_commands || typeof result.os_commands !== "object" || Array.isArray(result.os_commands)) throw new Error("Invalid os_commands");
    const commands = result.os_commands as Record<string, unknown>;
    for (const key of ["linux", "macos", "windows"]) {
      if (commands[key] !== undefined && (!Array.isArray(commands[key]) || commands[key].length > 100 || commands[key].some((item) => typeof item !== "string" || item.length > 4000))) throw new Error("Invalid os_commands");
    }
  }
  if (result.setup_steps !== undefined && result.setup_steps !== null && (!Array.isArray(result.setup_steps) || result.setup_steps.length > 100 || result.setup_steps.some((item) => typeof item !== "string" || item.length > 4000))) throw new Error("Invalid setup_steps");
  if (result.setup_guide !== undefined && !validateSetupGuide(result.setup_guide)) throw new Error("Invalid setup guide");
  return result;
}

export async function GET(request: NextRequest) {
  if (!await isAdminRequest(request)) return errorResponse("Unauthorized", 401);
  const db = getSupabaseAdminServer();
  if (!db) return errorResponse("Admin data access is unavailable", 503);
  const { data, error } = await db.from("agents").select("*").order("name");
  return error ? errorResponse("Unable to load agents", 503) : NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  if (!await isAdminRequest(request, true)) return errorResponse("Unauthorized or invalid CSRF token", 403);
  const db = getSupabaseAdminServer();
  if (!db) return errorResponse("Admin data access is unavailable", 503);
  let row: Record<string, unknown>;
  const parsed = await readJsonBody<unknown>(request, 64 * 1024);
  if (!parsed.ok) return NextResponse.json(jsonBodyError(parsed), { status: parsed.status });
  try {
    if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) throw new Error();
    row = clean(parsed.value as Record<string, unknown>);
  } catch { return errorResponse("Invalid agent data", 400); }
  const { data: result, error } = await db.rpc("admin_create_agent", { p_agent: row, p_changed_by: "admin" });
  if (error || !result || result.status !== "ok" || !result.agent) return errorResponse("Unable to save agent", 503);
  invalidateCatalogAgents();
  return NextResponse.json(result.agent, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (!await isAdminRequest(request, true)) return errorResponse("Unauthorized or invalid CSRF token", 403);
  const db = getSupabaseAdminServer();
  if (!db) return errorResponse("Admin data access is unavailable", 503);
  let input: Record<string, unknown>;
  try {
    const parsed = await readJsonBody<unknown>(request, 64 * 1024);
    if (!parsed.ok) return NextResponse.json(jsonBodyError(parsed), { status: parsed.status });
    const body = parsed.value;
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    input = body as Record<string, unknown>;
  }
  catch { return errorResponse("Invalid update", 400); }
  if (typeof input.id !== "string" || !uuid.test(input.id)) return errorResponse("Invalid id", 400);
  if (!Number.isInteger(input.revision) || (input.revision as number) < 1) return errorResponse("A valid revision is required", 400);
  const { data: previous, error: loadError } = await db.from("agents").select("*").eq("id", input.id).single();
  if (loadError) return errorResponse("Unable to load agent", 503);
  if (!previous) return errorResponse("Not found", 404);
  const expectedRevision = input.revision as number;
  delete input.id;
  delete input.revision;
  delete input.verification_score;
  let update: Record<string, unknown>;
  try {
    const cleaned = clean({ ...previous, ...input });
    const changedFields = Object.keys(input).filter((field) => fields.includes(field));
    if (changedFields.length === 0) throw new Error("No editable fields");
    update = Object.fromEntries(changedFields.map((field) => [field, cleaned[field]]));
    if (input.status !== undefined) update.is_archived = cleaned.is_archived;
  }
  catch { return errorResponse("Invalid update", 400); }
  const { data: result, error } = await db.rpc("admin_update_agent", {
    p_agent_id: previous.id,
    p_expected_revision: expectedRevision,
    p_agent: update,
    p_changed_by: "admin",
  });
  if (error) return errorResponse("Unable to save agent update", 503);
  if (!result || result.status === "conflict") return errorResponse("Agent was changed by another administrator; reload and try again", 409);
  if (result.status === "not_found") return errorResponse("Not found", 404);
  if (result.status !== "ok" || !result.agent) return errorResponse("Unable to save agent update", 503);
  invalidateCatalogAgents();
  return NextResponse.json(result.agent);
}
