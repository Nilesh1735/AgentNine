import { AccountDashboard } from "@/components/AccountDashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your account", robots: { index: false, follow: false } };

export default async function AccountPage() {
  return <main id="main-content" className="page-shell"><div className="container account-page"><div className="page-heading"><p className="eyebrow">Account</p><h1>Saved agents.</h1></div><AccountDashboard /></div></main>;
}
