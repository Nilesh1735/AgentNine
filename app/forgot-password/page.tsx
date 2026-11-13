import { ForgotPasswordForm } from "@/components/RecoveryForm";
import { AuthPageShell } from "@/components/AuthPageShell";
import { createPublicPageMetadata } from "@/lib/seo";

export const metadata = createPublicPageMetadata({
  title: "Reset Password for Your AgentNine Account",
  description: "Reset the password for your AgentNine account to regain access to saved agents, comparisons, and setup progress.",
  path: "/forgot-password",
  robots: { index: false, follow: false },
});

export default function ForgotPasswordPage() {
  return (
    <main id="main-content" className="page-shell auth-page-shell">
      <div className="container">
        <AuthPageShell title="Forgot your password?">
          <ForgotPasswordForm />
        </AuthPageShell>
      </div>
    </main>
  );
}
