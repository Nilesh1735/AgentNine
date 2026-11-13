import { AuthForm } from "@/components/AuthForm";
import { AuthPageShell } from "@/components/AuthPageShell";
import { createPublicPageMetadata } from "@/lib/seo";

export const metadata = createPublicPageMetadata({
  title: "Sign In to AgentNine to Access Saved Agents",
  description: "Sign in to your AgentNine account to access saved AI agents, comparison lists, and setup progress.",
  path: "/login",
  robots: { index: false, follow: true },
});

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ authError?: string }> }) {
  const { authError } = await searchParams;

  return (
    <main id="main-content" className="page-shell auth-page-shell">
      <div className="container">
        <AuthPageShell title="Sign in">
          <AuthForm mode="login" initialOAuthError={authError === "oauth"} />
        </AuthPageShell>
      </div>
    </main>
  );
}
