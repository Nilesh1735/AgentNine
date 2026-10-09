"use client";

import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AdminOperations } from "@/components/AdminOperations";
import type { Category } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";

type AdminAgent = {
  id: string;
  name: string;
  slug: string;
  category_id?: string;
  short_description?: string;
  github_url?: string;
  version_tag?: string;
  status: string;
  verification_score: number;
  revision: number;
  last_commit_at: string | null;
  requires_api_key?: boolean | null;
  is_flagship?: boolean;
  env_template?: string;
  common_errors?: string;
  hardware_requirements?: string;
  port_mapping?: string;
  memory_location?: string;
  network_access?: string;
  file_access?: string;
  uninstall_command?: string;
  first_launch_prompt?: string;
  cost_to_run?: string;
  tags?: string[];
  os_commands?: unknown[];
  setup_steps?: unknown[];
  setup_guide?: unknown;
};

type AgentForm = {
  name: string;
  slug: string;
  short_description: string;
  category_id: string;
  github_url: string;
  version_tag: string;
  status: string;
  tags: string;
  os_commands: string;
  setup_steps: string;
  setup_guide: string;
  requires_api_key: boolean | null;
  is_flagship: boolean;
  env_template: string;
  common_errors: string;
  hardware_requirements: string;
  port_mapping: string;
  memory_location: string;
  network_access: string;
  file_access: string;
  uninstall_command: string;
  first_launch_prompt: string;
  cost_to_run: string;
};

const emptyForm: AgentForm = {
  name: "", slug: "", category_id: "", short_description: "", github_url: "", version_tag: "",
  status: "draft", tags: "", os_commands: "{}", setup_steps: "[]", setup_guide: "{}",
  requires_api_key: null, is_flagship: false,
  env_template: "", common_errors: "", hardware_requirements: "", port_mapping: "",
  memory_location: "", network_access: "", file_access: "", uninstall_command: "",
  first_launch_prompt: "", cost_to_run: "",
};

const checks = [
  ["pinned_checkout_passed", "Pinned checkout/version"],
  ["dependency_install_passed", "Dependencies installed"],
  ["provider_setup_passed", "Provider setup understood"],
  ["first_prompt_passed", "First prompt completed"],
  ["normal_machine_run_passed", "Normal-machine run passed"],
] as const;

function csrf() {
  return document.cookie.split("; ").find((part) => part.startsWith("admin_csrf="))?.split("=")[1] ?? "";
}

function toForm(agent: AdminAgent): AgentForm {
  const osCommands = agent.os_commands && !Array.isArray(agent.os_commands) ? agent.os_commands : {};
  return {
    name: agent.name, slug: agent.slug, category_id: agent.category_id ?? "", short_description: agent.short_description ?? "",
    github_url: agent.github_url ?? "", version_tag: agent.version_tag ?? "",
    status: agent.status, tags: (agent.tags ?? []).join(", "),
    os_commands: JSON.stringify(osCommands, null, 2),
    setup_steps: JSON.stringify(agent.setup_steps ?? [], null, 2),
    setup_guide: JSON.stringify(agent.setup_guide ?? {}, null, 2),
    requires_api_key: agent.requires_api_key ?? null, is_flagship: agent.is_flagship ?? false,
    env_template: agent.env_template ?? "", common_errors: agent.common_errors ?? "",
    hardware_requirements: agent.hardware_requirements ?? "", port_mapping: agent.port_mapping ?? "",
    memory_location: agent.memory_location ?? "", network_access: agent.network_access ?? "",
    file_access: agent.file_access ?? "", uninstall_command: agent.uninstall_command ?? "",
    first_launch_prompt: agent.first_launch_prompt ?? "", cost_to_run: agent.cost_to_run ?? "",
  };
}

export function AdminDashboard({ categories }: { categories: Category[] }) {
  const [key, setKey] = useState("");
  const [agents, setAgents] = useState<AdminAgent[]>([]);
  const [selected, setSelected] = useState<AdminAgent | null>(null);
  const [form, setForm] = useState<AgentForm>(emptyForm);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [version, setVersion] = useState("");
  const [sourceCommitSha, setSourceCommitSha] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkChecklist, setBulkChecklist] = useState<Record<string, boolean>>({});
  const [bulkNotes, setBulkNotes] = useState("");
  const [bulkSourceCommitSha, setBulkSourceCommitSha] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [metadataRefreshing, setMetadataRefreshing] = useState(false);
  const [candidateSearching, setCandidateSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [serviceError, setServiceError] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  function handleSessionResponse(response: Response) {
    if (response.status !== 401 && response.status !== 403) return false;
    setAuthenticated(false);
    setServiceError("Your admin session has expired. Sign in again to continue.");
    setMessage("");
    return true;
  }

  async function load() {
    setLoading(true);
    setServiceError("");
    try {
      const response = await fetch("/api/admin/agents");
      if (response.status === 401 || response.status === 403) {
        setAuthenticated(false);
        return;
      }
      if (!response.ok) {
        setServiceError("The dashboard service is unavailable. Try again.");
        return;
      }
      const nextAgents = await response.json() as AdminAgent[];
      setAgents(nextAgents);
      setAuthenticated(true);
      return nextAgents;
    } catch (error) {
      console.error("Admin catalog request failed:", error);
      setServiceError("The dashboard service could not be reached. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }
  async function refreshCatalog() {
    setRefreshing(true);
    try {
      const nextAgents = await load();
      if (nextAgents) setMessage("Catalog refreshed.");
    } finally {
      setRefreshing(false);
    }
  }
  async function refreshGitHubMetadata() {
    setMetadataRefreshing(true);
    try {
      const response = await fetch("/api/admin/agents/metadata", { method: "PUT", headers: { "x-csrf-token": csrf() } });
      if (handleSessionResponse(response)) return;
      const result = await response.json().catch(() => null) as { updated?: number; failed?: number; failures?: Array<{ url?: string; reason?: string }>; error?: string } | null;
      const firstFailure = result?.failures?.[0]?.reason;
      setMessage(response.ok ? `Updated GitHub metadata for ${result?.updated ?? 0} agents${result?.failed ? `; ${result.failed} failed${firstFailure ? ` (${firstFailure})` : ""}` : ""}.` : result?.error ?? firstFailure ?? "GitHub metadata refresh failed.");
      if (response.ok) await load();
    } catch (error) {
      console.error("GitHub metadata refresh failed:", error);
      setMessage("GitHub metadata could not be refreshed. Try again.");
    } finally {
      setMetadataRefreshing(false);
    }
  }
  async function discoverCandidates() {
    setCandidateSearching(true);
    try {
      const response = await fetch("/api/admin/trending-candidates", { method: "POST", headers: { "x-csrf-token": csrf() } });
      if (handleSessionResponse(response)) return;
      const result = await response.json().catch(() => null) as { added?: number; error?: string } | null;
      setMessage(response.ok ? `Added ${result?.added ?? 0} GitHub candidates to the review queue.` : result?.error ?? "Candidate discovery failed.");
    } catch (error) {
      console.error("Candidate discovery failed:", error);
      setMessage("Candidate discovery could not reach GitHub. Try again.");
    } finally {
      setCandidateSearching(false);
    }
  }
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSigningIn(true);
    try {
      const response = await fetch("/api/admin/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key }) });
      if (response.ok) { setKey(""); setMessage(""); await load(); }
      else {
        trackEvent("admin_error", { endpoint: "auth", status: response.status });
        setMessage(response.status === 429
          ? "Too many attempts. Try again later."
          : response.status === 401
            ? "That dashboard key was not accepted."
            : response.status === 403
              ? "The sign-in request origin could not be verified. Reload the dashboard and try again."
              : "Dashboard sign-in is unavailable. Try again shortly.");
      }
    } catch (error) {
      console.error("Admin sign-in failed:", error);
      trackEvent("admin_error", { endpoint: "auth", status: 503 });
      setMessage("The dashboard service could not be reached. Try again.");
    } finally {
      setSigningIn(false);
    }
  }

  async function signOut() {
    setSigningOut(true);
    setMessage("");
    setServiceError("");
    try {
      const response = await fetch("/api/admin/auth", { method: "DELETE" });
      if (!response.ok) {
        setServiceError("Sign out failed. Please try again.");
        return;
      }
      setAuthenticated(false);
      setAgents([]);
      setSelected(null);
      setForm(emptyForm);
      setEditorOpen(false);
      setBulkOpen(false);
    } catch (error) {
      console.error("Admin sign-out failed:", error);
      setServiceError("Could not reach the dashboard service to sign out. Try again.");
    } finally {
      setSigningOut(false);
    }
  }

  function edit(agent: AdminAgent) {
    setSelected(agent);
    setEditorOpen(true);
    setForm(toForm(agent));
    setVersion(agent.version_tag ?? "");
    setSourceCommitSha("");
    setChecklist({});
    setNotes("");
  }

  function change(field: keyof AgentForm, value: string | boolean | null) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    let osCommands: unknown;
    let setupSteps: unknown;
    let setupGuide: unknown;
    try {
      osCommands = JSON.parse(form.os_commands);
      setupSteps = JSON.parse(form.setup_steps);
      setupGuide = JSON.parse(form.setup_guide);
      if (!osCommands || typeof osCommands !== "object" || Array.isArray(osCommands)
        || !Array.isArray(setupSteps) || !setupGuide || typeof setupGuide !== "object" || Array.isArray(setupGuide)) throw new Error();
    } catch {
      setMessage("OS commands and setup guide must be JSON objects; setup steps must be a JSON array.");
      setSaving(false);
      return;
    }
    try {
      const payload = { ...form, tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean), os_commands: osCommands, setup_steps: setupSteps, setup_guide: setupGuide };
      const response = await fetch("/api/admin/agents", {
        method: selected ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf() },
        body: JSON.stringify(selected ? { id: selected.id, revision: selected.revision, ...payload } : payload),
      });
      if (handleSessionResponse(response)) return;
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { error?: string };
        setMessage(body.error ?? "The agent could not be saved. Check required fields.");
        return;
      }
      setMessage(selected ? "Agent updated." : "Agent created.");
      setSelected(null);
      setEditorOpen(false);
      await load();
    } catch (error) {
      console.error("Admin agent save failed:", error);
      setMessage("The agent could not be saved because the dashboard service is unavailable. Your form is preserved.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(agent: AdminAgent, status: string) {
    try {
      const response = await fetch("/api/admin/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf() },
        body: JSON.stringify({ id: agent.id, revision: agent.revision, status }),
      });
      if (handleSessionResponse(response)) return;
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { error?: string };
        setMessage(body.error ?? "The status could not be updated.");
        return;
      }
      setMessage("Agent status updated.");
      await load();
    } catch (error) {
      console.error("Admin status update failed:", error);
      setMessage("The status could not be updated because the dashboard service is unavailable.");
    }
  }

  async function saveVerification(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !version.trim()) { setMessage("Select an agent and provide the checked version."); return; }
    try {
      const response = await fetch("/api/admin/agents/verifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf() },
        body: JSON.stringify({ agent_id: selected.id, checked_version: version.trim(), source_commit_sha: sourceCommitSha.trim() || undefined, notes, ...checklist }),
      });
      if (handleSessionResponse(response)) return;
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { error?: string };
        setMessage(body.error ?? "Verification evidence could not be saved.");
        return;
      }

      setMessage("Verification checklist saved; score recalculated.");
      const nextAgents = await load();
      const refreshed = nextAgents?.find((agent) => agent.id === selected.id);
      if (refreshed) setSelected(refreshed);
    } catch (error) {
      console.error("Verification save failed:", error);
      setMessage("Verification evidence could not be saved because the dashboard service is unavailable.");
    }
  }

  async function saveBulkVerification(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!agents.length) { setMessage("There are no agents to verify."); return; }
    setBulkConfirmOpen(true);
  }

  async function confirmBulkVerification() {
    setBulkConfirmOpen(false);
    setBulkSaving(true);
    try {
      const response = await fetch("/api/admin/agents/verifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf() },
        body: JSON.stringify({ agent_ids: agents.map((agent) => agent.id), source_commit_sha: bulkSourceCommitSha.trim() || undefined, notes: bulkNotes, ...bulkChecklist }),
      });
      if (handleSessionResponse(response)) return;
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { error?: string };
        setMessage(body.error ?? "Bulk verification could not be saved.");
        return;
      }
      const result = await response.json() as { updated?: number; verification_score?: number };
      setMessage(`${result.updated ?? agents.length} agents verified and updated to ${result.verification_score ?? 0}/5.`);
      setBulkOpen(false);
      setBulkChecklist({});
      setBulkNotes("");
      setBulkSourceCommitSha("");
      await load();
    } catch (error) {
      console.error("Bulk verification failed:", error);
      setMessage("Bulk verification could not be saved because the dashboard service is unavailable.");
    } finally {
      setBulkSaving(false);
    }
  }

  if (loading) return <div className="route-skeleton route-skeleton-admin-inline" role="status" aria-label="Loading dashboard"><span className="route-skeleton-block" aria-hidden="true" /><span className="route-skeleton-block" aria-hidden="true" /><span className="route-skeleton-block" aria-hidden="true" /></div>;
  if (!authenticated) return <form className="admin-login" onSubmit={signIn}><label htmlFor="admin-key">Dashboard key</label><input id="admin-key" type="password" value={key} onChange={(event) => setKey(event.target.value)} autoComplete="current-password" required /><button className="button button-dark" type="submit" disabled={signingIn}>{signingIn ? "Opening dashboard…" : "Open dashboard"}</button>{serviceError ? <p className="form-error" role="alert">{serviceError} <button type="button" className="text-link retry-inline" onClick={() => void load()}>Try again</button></p> : message ? <p className="form-error" role="alert">{message}</p> : null}</form>;

  return <div className="admin-dashboard">
    <div className="admin-toolbar"><div className="admin-summary"><span><strong>{agents.length}</strong> total</span><span><strong>{agents.filter((agent) => agent.status === "published").length}</strong> published</span><span><strong>{agents.filter((agent) => agent.verification_score === 0).length}</strong> unverified</span><span><strong>{agents.filter((agent) => agent.verification_score === 5).length}</strong> complete</span></div><div className="admin-toolbar-actions"><button className="button button-light" type="button" onClick={() => void refreshCatalog()} disabled={refreshing}>{refreshing ? "Refreshing..." : "Refresh"}</button><button className="button button-light" type="button" onClick={() => void refreshGitHubMetadata()} disabled={metadataRefreshing}>{metadataRefreshing ? "Updating GitHub..." : "Update GitHub data"}</button><button className="button button-light" type="button" onClick={() => void discoverCandidates()} disabled={candidateSearching}>{candidateSearching ? "Searching GitHub..." : "Find GitHub candidates"}</button><button className="button button-light" type="button" onClick={() => setBulkOpen((open) => !open)}>Verify all agents</button><button className="button button-dark" type="button" onClick={() => { setSelected(null); setForm(emptyForm); setEditorOpen(true); }}>Add agent</button><button className="button button-light" type="button" onClick={() => void signOut()} disabled={signingOut}>{signingOut ? "Signing out..." : "Sign out"}</button></div></div>
    {serviceError ? <p className="form-error" role="alert">{serviceError} <button type="button" className="text-link retry-inline" onClick={() => void load()}>Try again</button></p> : null}
    {message ? <p className={message.includes("could not") || message.includes("unavailable") ? "form-error" : "muted"} role={message.includes("could not") || message.includes("unavailable") ? "alert" : "status"} aria-live="polite">{message}</p> : null}
    {bulkConfirmOpen ? <ConfirmDialog title="Verify all agents?" message={`This will update verification evidence for all ${agents.length} catalog agents.`} confirmLabel="Verify all" onConfirm={() => void confirmBulkVerification()} onCancel={() => setBulkConfirmOpen(false)} /> : null}
    {bulkOpen ? <form onSubmit={saveBulkVerification} className="admin-bulk-panel"><div><p className="eyebrow">Bulk verification</p><h2>Verify all {agents.length} agents</h2><p className="muted">Each agent uses its current catalog version tag. This applies the same evidence checklist and notes to every agent in one batch.</p></div><label><input type="checkbox" checked={checks.every(([field]) => bulkChecklist[field] === true)} onChange={(event) => setBulkChecklist(Object.fromEntries(checks.map(([field]) => [field, event.target.checked])))} /> Select all checks</label>{checks.map(([field, label]) => <label key={field}><input type="checkbox" checked={bulkChecklist[field] ?? false} onChange={(event) => setBulkChecklist((current) => ({ ...current, [field]: event.target.checked }))} /> {label}</label>)}<label>Source commit SHA (optional; applies to every agent)<input value={bulkSourceCommitSha} onChange={(event) => setBulkSourceCommitSha(event.target.value)} maxLength={40} pattern="[0-9a-fA-F]{7,40}" /></label><label>Evidence notes<textarea rows={3} maxLength={4000} value={bulkNotes} onChange={(event) => setBulkNotes(event.target.value)} placeholder="Describe the evidence that applies to this batch." required /></label><div className="admin-form-actions"><button className="button button-light" type="button" onClick={() => setBulkOpen(false)}>Cancel</button><button className="button button-dark" type="submit" disabled={bulkSaving}>{bulkSaving ? "Updating agents..." : "Verify and update all"}</button></div></form> : null}
    <AdminOperations />
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Agent</th>
            <th>Status</th>
            <th>Verification</th>
            <th>Last updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((agent) => (
            <tr key={agent.id}>
              <th scope="row">
                <a href={`/agents/${agent.slug}`}>{agent.name}</a>
                <small>{agent.slug}</small>
              </th>
              <td>
                <select
                  aria-label={`Status for ${agent.name}`}
                  value={agent.status}
                  onChange={(event) => void updateStatus(agent, event.target.value)}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="needs_review">Needs review</option>
                  <option value="archived">Archived</option>
                </select>
              </td>
              <td>
                <span className={`admin-score admin-score-${agent.verification_score}`}>
                  {agent.verification_score}/5
                </span>
              </td>
              <td>
                {agent.last_commit_at
                  ? new Date(agent.last_commit_at).toLocaleDateString()
                  : "No commit date recorded"}
              </td>
              <td className="admin-row-actions">
                <button className="text-link" type="button" onClick={() => edit(agent)}>Edit</button>
                <button className="text-link" type="button" onClick={() => edit(agent)}>Verify</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {editorOpen ? <div className="admin-edit-panel">
      <div className="admin-panel-heading"><div><p className="eyebrow">Catalog editor</p><h2>{selected ? `Edit ${selected.name}` : "Add agent"}</h2></div><button className="button button-light" type="button" onClick={() => setEditorOpen(false)}>Close</button></div>
      <form onSubmit={save} className="admin-form">
        {(["name", "slug", "short_description", "github_url", "version_tag"] as const).map((field) => <label key={field}>{field.replaceAll("_", " ")}<input required={field !== "version_tag"} value={form[field]} onChange={(event) => change(field, event.target.value)} /></label>)}
        <label>category<select value={form.category_id} onChange={(event) => change("category_id", event.target.value)}><option value="">Unassigned</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
        <label>tags (comma separated)<input value={form.tags} onChange={(event) => change("tags", event.target.value)} /></label>
        <label>status<select value={form.status} onChange={(event) => change("status", event.target.value)}><option value="draft">Draft</option><option value="published">Published</option><option value="needs_review">Needs review</option><option value="archived">Archived</option></select></label>
        <label>Install / uninstall commands (README commands only)<textarea rows={15} value={form.setup_guide} onChange={(event) => change("setup_guide", event.target.value)} placeholder={'{\n  "source_url": "https://github.com/owner/project#readme",\n  "checked_at": "",\n  "platforms": {\n    "windows": {\n      "support": "unknown",\n      "install_commands": [],\n      "uninstall_commands": []\n    },\n    "macos": {\n      "support": "unknown",\n      "install_commands": [],\n      "uninstall_commands": []\n    },\n    "linux": {\n      "support": "unknown",\n      "install_commands": [],\n      "uninstall_commands": []\n    }\n  }\n}'} /></label>
        <label>API key requirement<select required={!selected} value={form.requires_api_key === null ? selected ? "unknown" : "" : form.requires_api_key ? "required" : "not-required"} onChange={(event) => change("requires_api_key", event.target.value === "unknown" ? null : event.target.value === "required")}><option value="" disabled={Boolean(selected)}>Choose a documented requirement</option><option value="unknown" disabled={!selected}>Depends on provider or not documented</option><option value="required">Required for documented setup</option><option value="not-required">Not required for documented local or default setup</option></select></label>
        <label><input type="checkbox" checked={form.is_flagship} onChange={(event) => change("is_flagship", event.target.checked)} /> flagship</label>
        {(["env_template", "common_errors", "hardware_requirements", "port_mapping", "memory_location", "network_access", "file_access", "first_launch_prompt", "cost_to_run"] as const).map((field) => <label key={field}>{field === "hardware_requirements" ? "Hardware only (CPU, RAM, GPU, disk)" : field.replaceAll("_", " ")}<textarea rows={3} value={form[field]} onChange={(event) => change(field, event.target.value)} /></label>)}
        <div className="admin-form-actions"><button className="button button-light" type="button" onClick={() => setEditorOpen(false)}>Cancel</button><button className="button button-dark" type="submit" disabled={saving}>{saving ? "Saving..." : "Save agent"}</button></div>
      </form>
      {selected ? <form onSubmit={saveVerification} className="admin-form"><h3>Verification checklist</h3><label>Checked version<input required value={version} onChange={(event) => setVersion(event.target.value)} /></label><label>Source commit SHA (optional)<input value={sourceCommitSha} onChange={(event) => setSourceCommitSha(event.target.value)} maxLength={40} pattern="[0-9a-fA-F]{7,40}" /></label>{checks.map(([field, label]) => <label key={field}><input type="checkbox" checked={checklist[field] ?? false} onChange={(event) => setChecklist((current) => ({ ...current, [field]: event.target.checked }))} /> {label}</label>)}<label>Evidence notes<textarea rows={3} maxLength={4000} value={notes} onChange={(event) => setNotes(event.target.value)} /></label><button className="button button-dark" type="submit">Save checklist</button></form> : null}
    </div> : null}
  </div>;
}
