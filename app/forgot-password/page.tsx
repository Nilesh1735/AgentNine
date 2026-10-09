import { ForgotPasswordForm } from "@/components/RecoveryForm";
import { AuthPageShell } from "@/components/AuthPageShell";

export const metadata = { title: "Forgot your password?", robots: { index: false, follow: false } };

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
