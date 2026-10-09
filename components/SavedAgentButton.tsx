"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { trackEvent } from "@/lib/analytics";

export function SavedAgentButton({ agentId, slug }: { agentId: string; slug?: string }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      queueMicrotask(() => setPending(false));
      return;
    }
    let active = true;
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      const id = data.user?.id ?? null;
      setUserId(id);
      if (!id) {
        setPending(false);
        return;
      }
      const result = await supabase.from("saved_agents").select("agent_id").eq("user_id", id).eq("agent_id", agentId).maybeSingle();
      if (!active) return;
      if (result.error && result.error.code !== "PGRST116") setMessage("Saved agents are not available yet.");
      setSaved(Boolean(result.data));
      setPending(false);
    }).catch(() => {
      if (active) {
        setMessage("Saved agents are not available right now.");
        setPending(false);
      }
    });
    return () => { active = false; };
  }, [agentId]);

  async function toggleSaved() {
    const supabase = getSupabaseBrowser();
    if (!supabase || !userId) {
      setMessage("Log in to save this agent.");
      return;
    }
    setPending(true);
    setMessage("");
    const result = saved
      ? await supabase.from("saved_agents").delete().eq("user_id", userId).eq("agent_id", agentId)
      : await supabase.from("saved_agents").insert({ user_id: userId, agent_id: agentId });
    if (result.error) {
      trackEvent("api_error", { endpoint: "saved_agents", status: result.error.code === "42P01" ? 503 : 500 });
      setMessage(result.error.code === "42P01" ? "Saved agents need the account migration enabled." : "Could not update your saved agents.");
    } else {
      setSaved(!saved);
      trackEvent("agent_saved", { ...(slug ? { slug } : {}), action: saved ? "removed" : "saved" });
    }
    setPending(false);
  }

  return (
    <div className="save-agent">
      <button type="button" className={`button button-outline save-agent-button${saved ? " is-saved" : ""}`} onClick={toggleSaved} disabled={pending} aria-pressed={saved}>
        <span aria-hidden="true">{saved ? "Saved" : "Save agent"}</span>
      </button>
      {message ? <p className="save-agent-message" role="status">{message}</p> : null}
    </div>
  );
}
