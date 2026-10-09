"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { getAuthErrorMessage } from "@/lib/auth-error-message";

type AuthMode = "login" | "signup";
type OAuthProvider = "google";

export function AuthForm({ mode, initialOAuthError = false }: { mode: AuthMode; initialOAuthError?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(
    initialOAuthError ? "Google sign-in could not be completed. Try again or use email and password." : "",
  );
  const [pending, setPending] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<OAuthProvider | null>(null);
  const isSignup = mode === "signup";
  const isBusy = pending || pendingProvider !== null;

  useEffect(() => {
    if (!isSignup) router.prefetch("/account");
  }, [isSignup, router]);

  async function signInWithGoogle() {
    const provider: OAuthProvider = "google";
    setMessage("");
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setMessage("Account access is not configured on this deployment.");
      return;
    }

    setPendingProvider(provider);
    try {
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("next", "/account");
      callbackUrl.searchParams.set("errorPath", isSignup ? "/signup" : "/login");
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: callbackUrl.toString() },
      });
      if (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn("Supabase OAuth sign-in could not start", {
            provider,
            status: error.status,
            code: error.code,
          });
        }
        setMessage("Could not start Google sign-in. Try again or use email and password.");
      }
    } catch (error) {
      console.error("OAuth sign-in request failed:", error);
      setMessage("We could not reach the account service. Check your connection and try again.");
    } finally {
      setPendingProvider(null);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setMessage("Account access is not configured on this deployment.");
      return;
    }
    setPending(true);
    const authStartedAt = performance.now();
    try {
      const result = isSignup
        ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/login` } })
        : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) {
        if (process.env.NODE_ENV === "development") {
          console.warn("Supabase authentication rejected the request", {
            status: result.error.status,
            code: result.error.code,
          });
        }
        setMessage(getAuthErrorMessage(result.error, mode));
        return;
      }
      if (isSignup) {
        setMessage("Check your email to confirm your account.");
      }
      else {
        if (process.env.NODE_ENV === "development") console.debug("Supabase sign-in completed", Math.round(performance.now() - authStartedAt), "ms");
        router.push("/account");
      }
    } catch (error) {
      console.error("Authentication request failed:", error);
      setMessage("We could not reach the account service. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="admin-login auth-form auth-card" onSubmit={submit} aria-busy={isBusy}>
      <div className="auth-social-actions" role="group" aria-label="Sign in with Google">
        <button type="button" className="button button-outline" onClick={signInWithGoogle} disabled={isBusy}>
          <svg className="google-mark" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.25 5.48-4.72 7.18l7.5 5.82c4.38-4.04 6.9-9.98 6.9-17.47z" />
            <path fill="#34A853" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.88.93 7.55 2.56 10.78l7.97-6.19z" />
            <path fill="#FBBC05" d="M24 48c6.48 0 11.93-2.13 15.91-5.79l-7.5-5.82c-2.08 1.39-4.74 2.21-8.41 2.21-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          {pendingProvider === "google" ? "Connecting to Google..." : "Continue with Google"}
        </button>
      </div>
      <div className="auth-divider" aria-hidden="true"><span>or use email</span></div>
      <label htmlFor="auth-email">Email</label>
      <input id="auth-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
      <label htmlFor="auth-password">Password</label>
      <div className="password-field">
        <input id="auth-password" type={showPassword ? "text" : "password"} autoComplete={isSignup ? "new-password" : "current-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} aria-describedby={isSignup ? "password-help" : undefined} />
        <button type="button" className="password-toggle" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? "Hide" : "Show"}</button>
      </div>
      {isSignup ? <p id="password-help" className="form-hint">Use at least 8 characters.</p> : null}
      <button type="submit" className="button button-dark" disabled={isBusy}>{pending ? isSignup ? "Creating account..." : "Signing you in..." : isSignup ? "Create account" : "Sign in"}</button>
      {!isSignup ? <Link className="auth-recovery text-link" href="/forgot-password">Forgot your password?</Link> : null}
      {isSignup ? <p className="auth-terms">By creating an account, you agree to the <Link className="text-link" href="/terms">Terms</Link> and acknowledge the <Link className="text-link" href="/privacy">Privacy policy</Link>.</p> : null}
      {message ? <p id="auth-message" className="auth-message" role={message.includes("could not") || message.includes("not accepted") ? "alert" : "status"} aria-live="polite">{message}</p> : null}
      <p className="auth-switch">{isSignup ? "Already have an account?" : "New to AgentNine?"}{" "}<Link className="text-link" href={isSignup ? "/login" : "/signup"}>{isSignup ? "Sign in" : "Create an account"}</Link></p>
    </form>
  );
}
