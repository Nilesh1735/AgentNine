"use client";

import { useEffect, useState, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import type { NewsPost, NewsPostStatus } from "@/lib/news";

type NewsPostForm = {
  title: string;
  slug: string;
  summary: string;
  content_markdown: string;
  author_name: string;
  source_urls: string;
  status: NewsPostStatus;
};

const emptyForm: NewsPostForm = {
  title: "",
  slug: "",
  summary: "",
  content_markdown: "",
  author_name: "AgentNine",
  source_urls: "",
  status: "draft",
};

function slugFromTitle(title: string) {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function readResponse<T>(response: Response): Promise<T> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("The server returned an unreadable response. Try again.");
  }
  if (!response.ok) {
    const message = payload && typeof payload === "object" && typeof (payload as Record<string, unknown>).error === "string"
      ? (payload as Record<string, string>).error
      : "The request could not be completed.";
    throw new Error(message);
  }
  return payload as T;
}

function toForm(post: NewsPost): NewsPostForm {
  return {
    title: post.title,
    slug: post.slug,
    summary: post.summary,
    content_markdown: post.content_markdown,
    author_name: post.author_name,
    source_urls: post.source_urls.join("\n"),
    status: post.status,
  };
}

export function NewsEditor() {
  const [key, setKey] = useState("");
  const [csrf, setCsrf] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [selected, setSelected] = useState<NewsPost | null>(null);
  const [form, setForm] = useState<NewsPostForm>(emptyForm);
  const [slugEdited, setSlugEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadPosts() {
    setLoading(true);
    try {
      setPosts(await readResponse<NewsPost[]>(await fetch("/api/news/editor/posts", { cache: "no-store" })));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "News posts could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    void fetch("/api/news/editor/auth", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) return null;
        return readResponse<{ csrf: string }>(response);
      })
      .then(async (session) => {
        if (!active || !session) return;
        setCsrf(session.csrf);
        setAuthenticated(true);
        await loadPosts();
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "The editor could not be loaded.");
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => { active = false; };
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const response = await fetch("/api/news/editor/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const session = await readResponse<{ csrf: string }>(response);
      setKey("");
      setCsrf(session.csrf);
      setAuthenticated(true);
      await loadPosts();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Sign-in failed.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    setError("");
    try {
      await readResponse<{ ok: boolean }>(await fetch("/api/news/editor/auth", { method: "DELETE" }));
      setAuthenticated(false);
      setCsrf("");
      setPosts([]);
      setSelected(null);
      setForm(emptyForm);
      setMessage("You have signed out.");
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : "Sign-out failed.");
    }
  }

  async function savePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    const payload = {
      title: form.title,
      slug: form.slug,
      summary: form.summary,
      content_markdown: form.content_markdown,
      author_name: form.author_name,
      source_urls: form.source_urls.split(/\r?\n/).map((source) => source.trim()).filter(Boolean),
      status: form.status,
    };
    try {
      const response = await fetch(selected ? `/api/news/editor/posts/${selected.id}` : "/api/news/editor/posts", {
        method: selected ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", "x-news-csrf-token": csrf },
        body: JSON.stringify(payload),
      });
      const saved = await readResponse<NewsPost>(response);
      setSelected(saved);
      setForm(toForm(saved));
      setSlugEdited(true);
      setMessage(saved.status === "published" ? "Article published." : "Draft saved.");
      await loadPosts();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Article could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  function selectPost(post: NewsPost) {
    setSelected(post);
    setForm(toForm(post));
    setSlugEdited(true);
    setError("");
    setMessage("");
  }

  function newPost() {
    setSelected(null);
    setForm(emptyForm);
    setSlugEdited(false);
    setError("");
    setMessage("");
  }

  if (!ready) return <p className="news-editor-state" role="status">Checking editor access…</p>;

  if (!authenticated) {
    return (
      <form className="news-editor-login contact-form" onSubmit={signIn}>
        <label className="news-editor-field">
          News editor key
          <input
            type="password"
            autoComplete="current-password"
            value={key}
            onChange={(event) => setKey(event.target.value)}
            required
          />
        </label>
        <button className="button button-dark" type="submit" disabled={saving}>{saving ? "Signing in…" : "Sign in"}</button>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
      </form>
    );
  }

  return (
    <section className="news-editor-workspace" aria-label="News editor workspace">
      <aside className="news-editor-sidebar">
        <div className="news-editor-toolbar">
          <h2>Articles</h2>
          <button className="button-light" type="button" onClick={newPost}>New article</button>
        </div>
        {loading ? <p className="news-editor-state" role="status">Loading articles…</p> : null}
        {!loading && !posts.length ? <p className="news-editor-state">No articles yet. Start with a new article.</p> : null}
        <ul className="news-editor-post-list">
          {posts.map((post) => (
            <li key={post.id}>
              <button
                className={`news-editor-post${selected?.id === post.id ? " is-selected" : ""}`}
                type="button"
                onClick={() => selectPost(post)}
              >
                <span>{post.title}</span>
                <small>{post.status === "published" ? "Published" : "Draft"}</small>
              </button>
            </li>
          ))}
        </ul>
        <button className="news-editor-signout" type="button" onClick={signOut}>Sign out</button>
      </aside>
      <div className="news-editor-main">
        <form className="news-editor-form contact-form" onSubmit={savePost}>
          <label className="news-editor-field">
            Article title
            <input
              maxLength={180}
              value={form.title}
              onChange={(event) => {
                const title = event.target.value;
                setForm((current) => ({ ...current, title, slug: slugEdited ? current.slug : slugFromTitle(title) }));
              }}
              required
            />
          </label>
          <label className="news-editor-field">
            Article URL slug
            <input
              maxLength={120}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              value={form.slug}
              disabled={selected?.status === "published"}
              onChange={(event) => {
                setSlugEdited(true);
                setForm((current) => ({ ...current, slug: event.target.value }));
              }}
              required
            />
          </label>
          <label className="news-editor-field">
            Short summary
            <textarea maxLength={300} rows={3} value={form.summary} onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))} required />
          </label>
          <div className="news-editor-writing-grid">
            <label className="news-editor-field">
              Article content (Markdown)
              <textarea
                className="news-editor-markdown-input"
                maxLength={100000}
                value={form.content_markdown}
                onChange={(event) => setForm((current) => ({ ...current, content_markdown: event.target.value }))}
                required
              />
              <span className="news-editor-hint">Use # headings, **bold**, lists, and [links](https://example.com). Raw HTML is not rendered.</span>
            </label>
            <div className="news-editor-preview">
              <strong>Preview</strong>
              <div className="news-article-body">
                {form.content_markdown ? <ReactMarkdown>{form.content_markdown}</ReactMarkdown> : <p>Your article preview will appear here.</p>}
              </div>
            </div>
          </div>
          <div className="news-editor-form-row">
            <label className="news-editor-field">
              Author
              <input maxLength={100} value={form.author_name} onChange={(event) => setForm((current) => ({ ...current, author_name: event.target.value }))} required />
            </label>
            <label className="news-editor-field">
              Publication status
              <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as NewsPostStatus }))}>
                <option value="draft">Draft (private)</option>
                <option value="published">Published (public)</option>
              </select>
            </label>
          </div>
          <label className="news-editor-field">
            Source URLs (one HTTPS URL per line)
            <textarea rows={3} value={form.source_urls} onChange={(event) => setForm((current) => ({ ...current, source_urls: event.target.value }))} />
          </label>
          <div className="news-editor-actions">
            <button className="button button-dark" type="submit" disabled={saving}>{saving ? "Saving…" : selected ? "Save article" : "Create article"}</button>
            {selected?.status === "published" ? <a className="button-light" href={`/news/${selected.slug}`} target="_blank" rel="noopener noreferrer">Open published page</a> : null}
          </div>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          {message ? <p className="form-success" role="status" aria-live="polite">{message}</p> : null}
        </form>
      </div>
    </section>
  );
}
