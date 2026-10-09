"use client";

import { getSupabaseBrowser } from "@/lib/supabase-browser";

export async function getContactAuthorizationHeader(): Promise<Record<string, string>> {
  const client = getSupabaseBrowser();
  if (!client) return {};
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
}
