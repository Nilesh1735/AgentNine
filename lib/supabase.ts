import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
}

function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
}

function getSupabaseServiceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_SECRET_KEY
    || process.env.SUPABASE_SERVICE_KEY;
}

let hasLoggedMissingAdminConfiguration = false;

export function getSupabasePublicServer(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

export function getSupabaseAdminServer(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const key = getSupabaseServiceKey();
  if (!url || !key) {
    if (!hasLoggedMissingAdminConfiguration) {
      const missing = [
        ...(!url ? ["NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL"] : []),
        ...(!key ? ["SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SECRET_KEY, or SUPABASE_SERVICE_KEY"] : []),
      ];
      console.error(`[Supabase] Admin client is unavailable; configure ${missing.join(" and ")}.`);
      hasLoggedMissingAdminConfiguration = true;
    }
    return null;
  }
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}
