import { ProfileDetails } from "@/components/ProfileDetails";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your profile", robots: { index: false, follow: false } };

export default function ProfilePage() {
  return (
    <main id="main-content" className="page-shell">
      <div className="container profile-page">
        <div className="page-heading">
          <p className="eyebrow">Profile</p>
          <h1>Your AgentNine profile.</h1>
          <p>Manage your account details and return to the agents you have saved.</p>
        </div>
        <ProfileDetails />
      </div>
    </main>
  );
}
