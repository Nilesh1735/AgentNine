"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export function DeleteAccountForm() {
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function submit() {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setMessage("Account services are not configured.");
      return;
    }
    setPending(true);
    setMessage("");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setMessage("Sign in again before deleting your account.");
      setPending(false);
      return;
    }
    const response = await fetch("/api/account/delete", {
      method: "POST",
      headers: { authorization: `Bearer ${data.session.access_token}`, "content-type": "application/json" },
    });
    const result = await response.json().catch(() => null) as { error?: string } | null;
    if (!response.ok) {
      setMessage(result?.error ?? "Could not delete your account.");
      setPending(false);
      return;
    }
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="account-delete">
      <label><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /> I understand that deletion removes my account, saved agents, category follows, saved-agent history, and contribution submissions linked to my account or email. Copies already sent to a contact provider may remain under its retention rules. This cannot be undone.</label>
      <button type="button" className="button button-danger" disabled={!confirmed || pending} onClick={() => void submit()}>{pending ? "Deleting..." : "Delete account"}</button>
      {message ? <p className="form-error" role="alert">{message}</p> : null}
    </div>
  );
}
