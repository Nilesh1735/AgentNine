import { unstable_cache } from "next/cache";
import { getSupabasePublicServer } from "./supabase";
import { CATALOG_AGENTS_TAG, CATALOG_CATEGORIES_TAG } from "./catalog-cache";
import { normalizeSetupGuide } from "./setup-guide";
import type { Agent, Category } from "./types";

const CATALOG_CACHE_SECONDS = 60;

export type CatalogResult<T> =
  | { status: "ready"; data: T[] }
  | { status: "unavailable"; data: T[]; errorCode: "not_configured" | "service_unavailable"; retryable: true };

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizeSourceUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.hostname !== "github.com" || url.username || url.password) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    url.pathname = `/${parts[0]}/${parts[1]}`;
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function normalizeOsCommands(value: unknown): Agent["os_commands"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  return {
    linux: isStringArray(record.linux) ? record.linux : undefined,
    macos: isStringArray(record.macos) ? record.macos : undefined,
    windows: isStringArray(record.windows) ? record.windows : undefined,
  };
}

function normalizeAgent(raw: Partial<Agent>): Agent {
  return {
    ...raw,
    id: raw.id ?? raw.slug ?? crypto.randomUUID(),
    name: raw.name ?? "Unnamed agent",
    slug: raw.slug ?? "unnamed-agent",
    short_description: raw.short_description ?? "",
    category_id: raw.category_id ?? "",
    tags: isStringArray(raw.tags) ? raw.tags : [],
    github_url: normalizeSourceUrl(raw.github_url),
    version_tag: raw.version_tag ?? "unversioned",
    os_commands: normalizeOsCommands(raw.os_commands),
    env_template: raw.env_template ?? "",
    common_errors: raw.common_errors ?? "",
    hardware_requirements: raw.hardware_requirements ?? "",
    port_mapping: raw.port_mapping ?? "",
    memory_location: raw.memory_location ?? "",
    network_access: raw.network_access ?? "",
    file_access: raw.file_access ?? "",
    uninstall_command: raw.uninstall_command ?? "",
    first_launch_prompt: raw.first_launch_prompt ?? "",
    cost_to_run: raw.cost_to_run ?? "",
    requires_api_key: raw.requires_api_key ?? null,
    is_flagship: raw.is_flagship ?? false,
    status: raw.status ?? "published",
    last_verified_date: raw.last_verified_date ?? "Not verified",
    stars: raw.stars ?? 0,
    last_commit_at: raw.last_commit_at ?? "",
    is_archived: raw.is_archived ?? false,
    setup_steps: isStringArray(raw.setup_steps) ? raw.setup_steps : [],
    setup_guide: normalizeSetupGuide(raw.setup_guide),
    verification_score: raw.verification_score ?? 0,
    metadata_last_checked_at: raw.metadata_last_checked_at ?? null,
    metadata_is_stale: raw.metadata_is_stale ?? null,
    metadata_source: raw.metadata_source ?? null,
    verified_commit_sha: raw.verified_commit_sha ?? null,
    verified_operating_systems: isStringArray(raw.verified_operating_systems) ? raw.verified_operating_systems : [],
    verified_install_command: stringValue(raw.verified_install_command),
    verified_first_task: stringValue(raw.verified_first_task),
    verification_failure_conditions: stringValue(raw.verification_failure_conditions),
    verification_notes: stringValue(raw.verification_notes),
    upstream_changed_since_verification: raw.upstream_changed_since_verification === true,
    last_release_at: raw.last_release_at ?? null,
  } as Agent;
}

const loadCategories = unstable_cache(async (): Promise<CatalogResult<Category>> => {
  const supabase = getSupabasePublicServer();
  if (!supabase) return { status: "unavailable", data: [], errorCode: "not_configured", retryable: true };
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) {
    throw new Error(error.message);
  }
  return { status: "ready", data: data?.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? "Published agent records in this category.",
  })) ?? [] };
}, ["public-categories-v1"], { revalidate: CATALOG_CACHE_SECONDS, tags: [CATALOG_CATEGORIES_TAG] });

export async function getCategories(): Promise<CatalogResult<Category>> {
  try {
    return await loadCategories();
  } catch (error) {
    console.error("Failed to load categories from Supabase:", error);
    return { status: "unavailable", data: [], errorCode: "service_unavailable", retryable: true };
  }
}

const loadAgents = unstable_cache(async (): Promise<CatalogResult<Agent>> => {
  const supabase = getSupabasePublicServer();
  if (!supabase) return { status: "unavailable", data: [], errorCode: "not_configured", retryable: true };
  const { data, error } = await supabase.from("agents").select("*").eq("status", "published").order("is_flagship", { ascending: false }).order("name");
  if (error) {
    throw new Error(error.message);
  }
  return { status: "ready", data: data?.map((agent) => normalizeAgent(agent as Partial<Agent>)) ?? [] };
}, ["published-agents-v1"], { revalidate: CATALOG_CACHE_SECONDS, tags: [CATALOG_AGENTS_TAG] });

export async function getAgents(): Promise<CatalogResult<Agent>> {
  try {
    return await loadAgents();
  } catch (error) {
    console.error("Failed to load published agents from Supabase:", error);
    return { status: "unavailable", data: [], errorCode: "service_unavailable", retryable: true };
  }
}

const loadAgent = unstable_cache(async (slug: string): Promise<Agent | undefined> => {
  const supabase = getSupabasePublicServer();
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data ? normalizeAgent(data as Partial<Agent>) : undefined;
}, ["published-agent-by-slug-v1"], { revalidate: CATALOG_CACHE_SECONDS, tags: [CATALOG_AGENTS_TAG] });

export async function getAgent(slug: string): Promise<Agent | undefined> {
  try {
    return await loadAgent(slug);
  } catch (error) {
    console.error(`Failed to load agent "${slug}" from Supabase:`, error);
    throw error;
  }
}

const loadCategory = unstable_cache(async (slug: string): Promise<Category | undefined> => {
  const supabase = getSupabasePublicServer();
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data ? {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description ?? "Published agent records in this category.",
  } : undefined;
}, ["category-by-slug-v1"], { revalidate: CATALOG_CACHE_SECONDS, tags: [CATALOG_CATEGORIES_TAG] });

export async function getCategory(slug: string): Promise<Category | undefined> {
  try {
    return await loadCategory(slug);
  } catch (error) {
    console.error(`Failed to load category "${slug}" from Supabase:`, error);
    throw error;
  }
}

export function getCategoryAgents(agents: Agent[], category: Category) {
  return agents.filter((agent) => agent.category_id === category.id).slice(0, 5);
}

export function getCategoryAgentCount(agents: Agent[], category: Category) {
  return agents.filter((agent) => agent.category_id === category.id).length;
}

export async function getRelatedAgents(agent: Agent, limit = 3): Promise<Agent[]> {
  const supabase = getSupabasePublicServer();
  const boundedLimit = Math.max(1, Math.min(Math.floor(limit) || 3, 10));
  if (supabase) {
    const { data, error } = await supabase.rpc("get_related_agents", {
      p_agent_id: agent.id,
      p_limit: boundedLimit,
    });
    if (!error && data) return data.map((candidate: Partial<Agent>) => normalizeAgent(candidate));
    if (error) console.warn("Related-agent database query failed; using the cached catalog fallback:", error.message);
  }

  const agents = (await getAgents()).data;
  const tagSet = new Set(agent.tags.map((tag) => tag.toLowerCase()));
  return agents
    .filter((candidate) => candidate.id !== agent.id)
    .map((candidate) => {
      const sharedTags = [...new Set(candidate.tags.map((tag) => tag.toLowerCase()))]
        .filter((tag) => tagSet.has(tag)).length;
      const sameCategory = candidate.category_id === agent.category_id;
      return { candidate, score: (sameCategory ? 3 : 0) + sharedTags };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.candidate.name.localeCompare(b.candidate.name))
    .slice(0, boundedLimit)
    .map(({ candidate }) => candidate);
}

export function getRecentlyUpdatedAgents(agents: Agent[], limit = 3) {
  return [...agents]
    .filter((agent) => Boolean(agent.last_commit_at))
    .sort((a, b) => new Date(b.last_commit_at).getTime() - new Date(a.last_commit_at).getTime())
    .slice(0, limit);
}

export function getFreshnessCutoff() {
  return Date.now() - 180 * 24 * 60 * 60 * 1000;
}
