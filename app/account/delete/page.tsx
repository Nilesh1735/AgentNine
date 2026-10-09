import { DeleteAccountForm } from "@/components/DeleteAccountForm";

export const metadata = { title: "Delete account", robots: { index: false, follow: false } };

export default function DeleteAccountPage() {
  return <main id="main-content" className="page-shell"><div className="container prose-page"><p className="eyebrow">Account</p><h1>Delete your account.</h1><p>Your saved agents and account credentials will be removed. Anonymous analytics and public catalog records are not linked to your account.</p><DeleteAccountForm /></div></main>;
}
