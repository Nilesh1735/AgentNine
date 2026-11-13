import { AuthForm } from "@/components/AuthForm";
import { AuthPageShell } from "@/components/AuthPageShell";
import { createPublicPageMetadata } from "@/lib/seo";

export const metadata = createPublicPageMetadata({
  title: "Create an AgentNine Account to Save AI Agents",
  description: "Create an AgentNine account to save AI agents, keep a comparison list, and track setup progress.",
  path: "/signup",
  robots: { index: false, follow: true },
});

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ authError?: string }> }) {
  const { authError } = await searchParams;

  return (
    <main id="main-content" className="page-shell auth-page-shell">
      <div className="container">
        <AuthPageShell title="Create an account">
          <AuthForm mode="signup" initialOAuthError={authError === "oauth"} />
        </AuthPageShell>
      </div>
    </main>
  );
}
