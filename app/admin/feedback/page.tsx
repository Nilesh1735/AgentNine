import Link from "next/link";
import { SiteFeedbackModeration } from "@/components/SiteFeedbackModeration";
import { getAdminSessionFromToken } from "@/lib/admin";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const metadata = { title: "Community feedback review", robots: { index: false, follow: false } };

export default async function AdminFeedbackPage() {
  const cookieStore = await cookies();
  const adminSession = await getAdminSessionFromToken(cookieStore.get("admin_session")?.value);

  return (
    <main id="main-content" className="page-shell">
      <div className="container admin-feedback-page">
        <div className="page-heading">
          <h1>Community feedback</h1>
          <p>Review submissions and publish only feedback with the submitter&apos;s permission.</p>
        </div>
        {adminSession ? (
          <>
            <nav className="admin-feedback-navigation" aria-label="Admin navigation">
              <Link className="button button-light" href="/admin">Back to admin dashboard</Link>
            </nav>
            <SiteFeedbackModeration />
          </>
        ) : (
          <section className="admin-feedback-access">
            <h2>Sign in to review submissions.</h2>
            <p>This page is available to authorized AgentNine administrators.</p>
            <Link className="button button-dark" href="/admin">Go to admin sign in</Link>
          </section>
        )}
      </div>
    </main>
  );
}
