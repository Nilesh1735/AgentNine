import { ResetPasswordForm } from "@/components/RecoveryForm";
import { AuthPageShell } from "@/components/AuthPageShell";

export const metadata = { title: "Choose a new password", robots: { index: false, follow: false } };

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
