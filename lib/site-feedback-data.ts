import { getSitemapLastModified } from "@/lib/sitemap";
import { getSupabaseAdminServer } from "@/lib/supabase";

export async function getLatestPublishedSiteFeedbackUpdate(): Promise<Date | undefined> {
  const db = getSupabaseAdminServer();
  if (!db) return undefined;

  const { data, error } = await db
    .from("site_feedback")
    .select("published_at")
    .eq("status", "published")
    .eq("publication_consent", true)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Latest published feedback timestamp could not be loaded for the sitemap:", error.message);
    return undefined;
  }
  return getSitemapLastModified(data?.published_at);
}
