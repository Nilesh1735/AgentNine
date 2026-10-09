"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { Agent } from "@/lib/types";
import { getAgentTrustState, getFreshnessNote } from "@/lib/trust";
import { getCompactVersionLabel } from "@/lib/agent-metadata-display";
import ArrowRight from "reicon-react/icons/ArrowRight";

function AccountAgentSkeleton() {
  return (
    <article className="account-agent route-skeleton-account-card" aria-hidden="true">
      <span className="route-skeleton-block" />
      <span className="route-skeleton-block" />
      <span className="route-skeleton-block" />
      <span className="route-skeleton-block" />
      <span className="route-skeleton-block" />
    </article>
  );
}

export function AccountDashboard() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedLoading, setSavedLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const savedAgents = useMemo(() => agents.filter((agent) => savedIds.includes(agent.id)), [agents, savedIds]);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      queueMicrotask(() => {
        setMessage("Account access is not configured on this deployment.");
        setLoading(false);
      });
      return;
    }
    let active = true;
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      if (!data.user) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }
      setAuthenticated(true);
      setEmail(data.user.email ?? "");
      const [result, agentResult] = await Promise.all([
        supabase.from("saved_agents").select("agent_id, created_at").eq("user_id", data.user.id).order("created_at", { ascending: false }),
        supabase.from("agents").select("*").eq("status", "published"),
      ]);
      if (!active) return;
      if (result.error) setMessage(result.error.code === "42P01" ? "Saved agents are not enabled yet. Apply supabase/account-features.sql." : "Saved agents could not be loaded.");
      else setSavedIds((result.data ?? []).map((item) => item.agent_id));
      setSavedLoading(false);
      if (agentResult.error) setMessage((current) => current || "Your saved agents could not be displayed right now.");
      else setAgents(agentResult.data ?? []);
      setLoading(false);
    }).catch(() => {
      if (active) {
        setMessage("Your account could not be loaded right now.");
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  async function signOut() {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    const result = await supabase.auth.signOut();
    if (result.error) {
      setMessage("Could not sign out right now.");
      return;
    }
    router.push("/");
  }

  if (loading) return <div className="route-skeleton route-skeleton-account-inline account-dashboard" role="status" aria-label="Loading account">
    <section className="account-summary route-skeleton-account-summary" aria-hidden="true">
      <div><span className="route-skeleton-block" /><span className="route-skeleton-block" /></div>
      <div><span className="route-skeleton-block" /><span className="route-skeleton-block" /></div>
    </section>
    <section className="account-section" aria-hidden="true">
      <div className="route-skeleton-section-heading"><div><span className="route-skeleton-block" /><span className="route-skeleton-block" /></div><span className="route-skeleton-block route-skeleton-account-count" /></div>
      <div className="agent-grid">{[0, 1, 2].map((item) => <AccountAgentSkeleton key={item} />)}</div>
    </section>
  </div>;
  if (!authenticated) return <div className="account-empty"><h2>Sign in to view saved agents.</h2><Link className="button button-dark" href="/login">Sign in</Link></div>;
  return (
    <div className="account-dashboard">
      <section className="account-summary">
        <div><p className="eyebrow">Signed in as</p><h2>{email || "Account"}</h2></div>
        <div className="account-actions"><button type="button" className="button button-outline" onClick={signOut}>Sign out</button><Link className="text-link" href="/account/delete">Delete account</Link></div>
      </section>
      {message ? <p className="account-message" role="status">{message}</p> : null}
      <section className="account-section" aria-labelledby="saved-agents-title">
        <div className="account-section-heading"><div><p className="eyebrow">Library</p><h2 id="saved-agents-title">Saved agents</h2></div><span>{savedAgents.length} saved</span></div>
        {savedLoading ? <div className="route-skeleton route-skeleton-account-cards agent-grid" aria-label="Loading saved agents" role="status">{[0, 1, 2].map((item) => <AccountAgentSkeleton key={item} />)}</div> : savedAgents.length ? <div className="agent-grid">{savedAgents.map((agent) => { const trust = getAgentTrustState(agent); return <article className="account-agent" key={agent.id}><div><p className="card-category">{getCompactVersionLabel(agent.version_tag)}</p><h3><Link href={`/agents/${agent.slug}`}>{agent.name}</Link></h3><p>{agent.short_description}</p><p className="saved-agent-signal"><span className={trust.className}>{trust.label}</span> <span>{getFreshnessNote(agent)}</span></p></div><Link className="text-link" href={`/agents/${agent.slug}`}>Open guide <ArrowRight size={14} aria-hidden="true" /></Link></article>; })}</div> : <div className="account-empty"><h3>Your saved list is empty.</h3><p>Save an agent from its guide and it will appear here.</p><Link className="button button-dark" href="/search">Browse agents</Link></div>}
      </section>
    </div>
  );
}
