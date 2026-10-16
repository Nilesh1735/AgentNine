import { getSupabaseAdminServer, getSupabasePublicServer } from "@/lib/supabase";

export type NewsPostStatus = "draft" | "published";

export type NewsPost = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content_markdown: string;
  author_name: string;
  source_urls: string[];
  status: NewsPostStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type NewsPostSummary = Omit<NewsPost, "content_markdown">;

const publicListFields = "id,title,slug,summary,author_name,source_urls,status,published_at,created_at,updated_at";
const publicFields = `${publicListFields},content_markdown`;

export async function getPublishedNewsPosts(): Promise<NewsPostSummary[]> {
  const supabase = getSupabasePublicServer();
  if (!supabase) throw new Error("Public Supabase configuration is required to load news.");
  const { data, error } = await supabase
    .from("news_posts")
    .select(publicFields)
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error) {
    console.error("Published news could not be loaded:", error.message);
    throw new Error("Published news is unavailable.");
  }
  return (data ?? []) as NewsPostSummary[];
}

export async function getPublishedNewsPost(slug: string): Promise<NewsPost | undefined> {
  const supabase = getSupabasePublicServer();
  if (!supabase) throw new Error("Public Supabase configuration is required to load news.");
  const { data, error } = await supabase
    .from("news_posts")
    .select(publicFields)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error(`News article "${slug}" could not be loaded:`, error.message);
    throw new Error("News article is unavailable.");
  }
  return data ? data as NewsPost : undefined;
}

export async function getAllNewsPosts(): Promise<NewsPost[]> {
  const supabase = getSupabaseAdminServer();
  if (!supabase) throw new Error("News editor database access is unavailable.");
  const { data, error } = await supabase
    .from("news_posts")
    .select(publicFields)
    .order("updated_at", { ascending: false });
  if (error) {
    console.error("News editor could not load posts:", error.message);
    throw new Error("News posts are unavailable.");
  }
  return (data ?? []) as NewsPost[];
}
