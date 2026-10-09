import Link from "next/link";
import { createPublicPageMetadata } from "@/lib/seo";

export const metadata = createPublicPageMetadata({
  title: "Cookies and preferences",
  description: "How AgentNine uses cookies and stores preferences in Supabase.",
  path: "/cookies",
});

export default function CookiesPage() {
  return <main id="main-content" className="page-shell"><div className="container prose-page"><p className="eyebrow">Legal</p><h1>Cookies and preferences.</h1><p>AgentNine does not use advertising cookies. Optional analytics is off unless you choose “Allow analytics”. Preferences are stored in Supabase rather than localStorage or sessionStorage.</p><h2>Necessary cookies</h2><p>A random, HttpOnly visitor identifier keeps your theme, comparison list, setup progress, recent agents, analytics choice, and feedback response associated with your browser. Supabase authentication may set additional cookies to maintain an account session. These cookies are not used for advertising.</p><h2>Optional analytics</h2><p>If you allow analytics, AgentNine records limited usage events and may retain campaign attribution. Declining analytics disables event collection and clears the stored analytics session identifier and attribution. Your other preferences continue to work.</p><h2>Database retention</h2><p>Visitor preferences are stored in Supabase. The application does not currently configure an automatic expiration period for those records; the production retention schedule must be confirmed before launch. Clearing cookies in your browser removes the identifier from that browser but does not delete the related database record.</p><h2>Your choice</h2><p>You can change your analytics choice at any time on the <Link className="text-link" href="/privacy/choices">privacy choices page</Link>.</p></div></main>;
}
