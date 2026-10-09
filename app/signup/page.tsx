import { AuthForm } from "@/components/AuthForm";
import { AuthPageShell } from "@/components/AuthPageShell";

export const metadata = { title: "Create an account", robots: { index: false, follow: false } };

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
