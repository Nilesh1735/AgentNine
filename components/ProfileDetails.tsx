"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { ProfileCardSkeleton } from "@/components/ProfileCardSkeleton";

export function ProfileDetails() {
  const [email, setEmail] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [loading, setLoading] = useState(() => getSupabaseBrowser() !== null);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      setEmail(data.user?.email ?? "");
      setCreatedAt(data.user?.created_at ?? "");
    } catch (cause) {
      console.error("Profile could not be loaded:", cause);
      setError("Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  if (loading) return <ProfileCardSkeleton />;
  if (error) return <div className="account-empty" role="alert"><h2>Could not load your profile.</h2><p>{error}</p><button className="button button-dark" type="button" onClick={() => void loadProfile()}>Try again</button></div>;
  if (!email) return <div className="account-empty"><h2>Sign in to view your profile.</h2><Link className="button button-dark" href="/login">Sign in</Link></div>;

  const initials = email.slice(0, 2).toUpperCase();
  const joined = createdAt ? new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date(createdAt)) : "Recently";
  return (
    <section className="profile-card" aria-labelledby="profile-card-title">
      <div className="profile-card-identity">
        <span className="profile-avatar profile-avatar-xl" aria-hidden="true">{initials}</span>
        <div>
          <p className="eyebrow">Account identity</p>
          <h2 id="profile-card-title">{email}</h2>
          <p>Member since {joined}.</p>
        </div>
      </div>
      <div className="profile-card-actions">
        <Link className="button button-dark" href="/account">View saved agents</Link>
        <Link className="button button-outline" href="/account/delete">Delete account</Link>
      </div>
    </section>
  );
}
