import { AdminDashboard } from "@/components/AdminDashboard";
import { getCategories } from "@/lib/data";
import { cookies } from "next/headers";
import { getAdminSessionFromToken } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin dashboard", robots: { index: false, follow: false } };

export default async function AdminPage() {
  const cookieStore = await cookies();
  const adminSession = await getAdminSessionFromToken(cookieStore.get("admin_session")?.value);
  const categories = adminSession ? await getCategories() : { data: [], status: "unavailable" as const, errorCode: "unauthorized" as const };
  return <main id="main-content" className="page-shell"><div className="container"><div className="page-heading"><p className="eyebrow">Private operations</p><h1>Agent dashboard.</h1><p>Manage the complete catalog and record verification evidence. This area requires the server-only dashboard key.</p></div><AdminDashboard categories={categories.data} /></div></main>;
}
