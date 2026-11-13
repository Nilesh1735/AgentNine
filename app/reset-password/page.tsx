import { ResetPasswordForm } from "@/components/RecoveryForm";
import { AuthPageShell } from "@/components/AuthPageShell";
import { createPublicPageMetadata } from "@/lib/seo";

export const metadata = createPublicPageMetadata({
  title: "Set a New Password for Your AgentNine Account",
  description: "Choose a new password for your AgentNine account to restore access to your saved agents and setup tools.",
  path: "/reset-password",
  robots: { index: false, follow: false },
});

export default function ResetPasswordPage() {
  return (
    <main id="main-content" className="page-shell auth-page-shell">
      <div className="container">
        <AuthPageShell title="Choose a new password">
          <ResetPasswordForm />
        </AuthPageShell>
      </div>
    </main>
  );
}
