"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { getSupabaseBrowser } from "@/lib/supabase-browser";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setMessage("Password recovery is not configured on this deployment.");
      return;
    }
    setPending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setMessage(error ? "We could not send a reset email. Check the address and try again." : "If an account exists for that address, a reset link is on its way.");
    } catch (error) {
      console.error("Password recovery request failed:", error);
      setMessage("We could not reach the account service. Try again shortly.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="auth-form auth-recovery-form" onSubmit={submit} aria-busy={pending}>
      <p className="auth-helper">Enter your account email and we will send a link to choose a new password.</p>
      <label htmlFor="recovery-email">Email</label>
      <input id="recovery-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
      <button type="submit" className="button button-dark" disabled={pending}>{pending ? "Sending..." : "Send reset link"}</button>
      {message ? <p className="auth-message" role="status" aria-live="polite">{message}</p> : null}
      <p className="auth-switch"><Link className="text-link" href="/login">Back to log in</Link></p>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmation) {
      setMessage("Passwords do not match.");
      return;
    }
    setMessage("");
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setMessage("Password recovery is not configured on this deployment.");
      return;
    }
    setPending(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMessage("We could not update your password. Request a new reset link and try again.");
        return;
      }
      setMessage("Your password was updated. Redirecting to your account...");
      window.setTimeout(() => {
        router.push("/account");
        router.refresh();
      }, 700);
    } catch (error) {
      console.error("Password update failed:", error);
      setMessage("We could not reach the account service. Try again shortly.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="auth-form auth-recovery-form" onSubmit={submit} aria-busy={pending}>
      <p className="auth-helper">Use at least eight characters for your new password.</p>
      <label htmlFor="reset-password">New password</label>
      <div className="password-field">
        <input id="reset-password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
        <button type="button" className="password-toggle" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? "Hide" : "Show"}</button>
      </div>
      <label htmlFor="reset-password-confirmation">Confirm password</label>
      <input id="reset-password-confirmation" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
      <button type="submit" className="button button-dark" disabled={pending}>{pending ? "Updating..." : "Update password"}</button>
      {message ? <p className="auth-message" role="status" aria-live="polite">{message}</p> : null}
    </form>
  );
}
