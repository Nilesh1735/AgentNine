import { NewsEditor } from "@/components/NewsEditor";
import { createPublicPageMetadata } from "@/lib/seo";

export const metadata = {
  ...createPublicPageMetadata({
    title: "News editor",
    description: "Private editorial tools for AgentNine news.",
    path: "/news/editor",
  }),
  robots: { index: false, follow: false },
};

export default function NewsEditorPage() {
  return (
    <main id="main-content" className="page-shell news-editor-page">
      <div className="container">
        <header className="page-heading news-editor-heading">
          <h1>News editor.</h1>
          <p>Write, preview, and publish AgentNine news articles.</p>
        </header>
        <NewsEditor />
      </div>
    </main>
  );
}
