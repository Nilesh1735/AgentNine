import type { NewsPostStatus } from "@/lib/news";

export type NewsPostInput = {
  title: string;
  slug: string;
  summary: string;
  content_markdown: string;
  author_name: string;
  source_urls: string[];
  status: NewsPostStatus;
};

export type NewsPostValidation =
  | { ok: true; value: NewsPostInput }
  | { ok: false; error: string };

function boundedText(value: unknown, minimum: number, maximum: number): value is string {
  return typeof value === "string" && value.trim().length >= minimum && value.trim().length <= maximum;
}

export function validateNewsPostInput(input: unknown): NewsPostValidation {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "Invalid post data." };
  }
  const body = input as Record<string, unknown>;
  if (!boundedText(body.title, 3, 180)) return { ok: false, error: "Title must be between 3 and 180 characters." };
  if (typeof body.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug) || body.slug.length > 120) {
    return { ok: false, error: "Use a lowercase URL slug with letters, numbers, and hyphens." };
  }
  if (!boundedText(body.summary, 1, 300)) return { ok: false, error: "Summary must be 1 to 300 characters." };
  if (!boundedText(body.content_markdown, 1, 100000) || Buffer.byteLength(body.content_markdown, "utf8") > 100000) {
    return { ok: false, error: "Article content must be between 1 and 100,000 characters." };
  }
  if (!boundedText(body.author_name, 1, 100)) return { ok: false, error: "Author name must be 1 to 100 characters." };
  if (body.status !== "draft" && body.status !== "published") return { ok: false, error: "Choose draft or published status." };
  if (!Array.isArray(body.source_urls) || body.source_urls.length > 20 || body.source_urls.some((value) => typeof value !== "string")) {
    return { ok: false, error: "Sources must be a list of up to 20 HTTPS links." };
  }
  for (const source of body.source_urls) {
    if (source.length > 2048) return { ok: false, error: "Source URLs cannot be longer than 2,048 characters." };
    try {
      const url = new URL(source);
      if (url.protocol !== "https:" || url.username || url.password || url.hostname.length < 3) throw new Error();
    } catch {
      return { ok: false, error: "Every source must be a valid HTTPS URL." };
    }
  }
  return {
    ok: true,
    value: {
      title: body.title.trim(),
      slug: body.slug,
      summary: body.summary.trim(),
      content_markdown: body.content_markdown.trim(),
      author_name: body.author_name.trim(),
      source_urls: (body.source_urls as string[]).map((source) => source.trim()),
      status: body.status,
    },
  };
}
