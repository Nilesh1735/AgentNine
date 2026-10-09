import type { ReactNode } from "react";
import { HomeCatalogLoadingSkeleton, HomeHeroLoadingSkeleton } from "@/components/HomeLoadingSkeleton";
import { SearchContentSkeleton } from "@/components/SearchContentSkeleton";
import { ProfileCardSkeleton } from "@/components/ProfileCardSkeleton";
import { CompareLoadingSkeleton } from "@/components/CompareLoadingSkeleton";

export type RouteSkeletonVariant =
  | "search"
  | "categories"
  | "category"
  | "agent"
  | "faq"
  | "about"
  | "terms"
  | "privacy"
  | "cookies"
  | "refunds"
  | "methodology"
  | "contact"
  | "join"
  | "auth"
  | "recovery"
  | "reset-password"
  | "account"
  | "profile"
  | "admin"
  | "compare"
  | "delete-account"
  | "home";

function Block({ className = "" }: { className?: string }) {
  return <span className={`route-skeleton-block ${className}`} aria-hidden="true" />;
}

function PageHeading({ description = false }: { description?: boolean }) {
  return (
    <header className="route-skeleton-heading">
      <Block className="route-skeleton-eyebrow" />
      <Block className="route-skeleton-title" />
      {description ? <Block className="route-skeleton-description" /> : null}
    </header>
  );
}

function AgentCardSkeleton() {
  return (
    <div className="agent-card route-skeleton-card" aria-hidden="true">
      <div className="route-skeleton-card-meta"><Block /><Block /></div>
      <Block className="route-skeleton-card-title" />
      <Block className="route-skeleton-card-copy" />
      <Block className="route-skeleton-card-copy route-skeleton-card-copy-short" />
      <div className="route-skeleton-card-footer"><Block /><Block /></div>
    </div>
  );
}

function Cards({ count = 3 }: { count?: number }) {
  return Array.from({ length: count }, (_, index) => <AgentCardSkeleton key={index} />);
}

function CategoryCardSkeleton() {
  return (
    <div className="agent-card route-skeleton-card route-skeleton-category-card" aria-hidden="true">
      <Block className="route-skeleton-category-count" />
      <Block className="route-skeleton-card-title" />
      <Block className="route-skeleton-card-copy" />
      <Block className="route-skeleton-card-copy route-skeleton-card-copy-short" />
      <Block className="route-skeleton-category-link" />
    </div>
  );
}

function SearchSkeleton() {
  return (
    <main id="main-content" className="page-shell search-page route-skeleton route-skeleton-search" aria-busy="true">
      <div className="container">
        <PageHeading />
        <SearchContentSkeleton announce={false} />
      </div>
    </main>
  );
}

function HomeSkeleton() {
  return (
    <main id="main-content" className="route-skeleton route-skeleton-home-page" aria-busy="true">
      <HomeHeroLoadingSkeleton />
      <HomeCatalogLoadingSkeleton />
      <section className="section new-standards route-skeleton-home-standards" aria-hidden="true">
        <div className="container">
          <div className="standards-intro">
            <Block className="route-skeleton-eyebrow" />
            <Block className="route-skeleton-home-section-title" />
            <Block className="route-skeleton-home-copy" />
            <Block className="route-skeleton-home-copy route-skeleton-home-copy-short" />
          </div>
          <div className="standards-list">
            {[0, 1, 2].map((item) => (
              <div className="feature-item" key={item}>
                <Block className="route-skeleton-home-feature-mark" />
                <Block className="route-skeleton-home-feature-title" />
                <Block className="route-skeleton-home-copy" />
                <Block className="route-skeleton-home-copy route-skeleton-home-copy-short" />
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section faq-section route-skeleton-home-faq" aria-hidden="true">
        <div className="container faq-layout">
          <div>
            <Block className="route-skeleton-eyebrow" />
            <Block className="route-skeleton-home-section-title" />
            <Block className="route-skeleton-home-copy" />
            <Block className="route-skeleton-home-copy route-skeleton-home-copy-short" />
          </div>
          <div className="home-faq-list">
            {[0, 1, 2].map((item) => (
              <div className="home-faq-item" key={item}>
                <Block className="route-skeleton-home-question" />
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section founder-invite route-skeleton-home-invite" aria-hidden="true">
        <div className="container founder-invite-layout">
          <div>
            <Block className="route-skeleton-eyebrow" />
            <Block className="route-skeleton-home-section-title" />
            <Block className="route-skeleton-home-copy" />
            <Block className="route-skeleton-home-copy route-skeleton-home-copy-short" />
          </div>
          <div className="route-skeleton-home-avatars">
            <Block />
            <Block />
          </div>
        </div>
      </section>
    </main>
  );
}

function CategorySkeleton({ detail = false }: { detail?: boolean }) {
  return (
    <main id="main-content" className={`page-shell route-skeleton ${detail ? "route-skeleton-category-detail" : "route-skeleton-categories"}`} aria-busy="true">
      <div className={`container ${detail ? "browse-layout" : ""}`}>
        {detail ? <aside className="route-skeleton-category-nav"><Block />{[0, 1, 2, 3, 4].map((item) => <Block key={item} />)}</aside> : null}
        <div>
          <PageHeading description={detail} />
          <div className="agent-grid">
            {detail ? <Cards /> : Array.from({ length: 6 }, (_, index) => <CategoryCardSkeleton key={index} />)}
          </div>
        </div>
      </div>
    </main>
  );
}

function AgentSkeleton() {
  return (
    <main id="main-content" className="route-skeleton route-skeleton-agent" aria-busy="true">
      <section className="agent-hero">
        <div className="container">
          <div className="route-skeleton-breadcrumbs"><Block /><Block /><Block /></div>
          <div className="route-skeleton-agent-kicker"><Block /><Block /></div>
          <Block className="route-skeleton-agent-title" />
          <Block className="route-skeleton-agent-summary" />
          <div className="route-skeleton-agent-meta">{[0, 1, 2, 3, 4, 5].map((item) => <Block key={item} />)}</div>
          <div className="route-skeleton-agent-actions"><Block /><Block /><Block /></div>
        </div>
      </section>
      <div className="container agent-layout">
        <article className="route-skeleton-agent-content">
          <div className="route-skeleton-agent-toc">{[0, 1, 2, 3].map((item) => <Block key={item} />)}</div>
          <section className="content-section route-skeleton-agent-section route-skeleton-agent-verification">
            <div className="route-skeleton-agent-verification-heading"><Block className="route-skeleton-agent-section-title" /><Block /></div>
            <div className="route-skeleton-agent-checks">{[0, 1, 2, 3, 4].map((item) => <Block key={item} />)}</div>
          </section>
          <section className="content-section route-skeleton-agent-section">
            <Block className="route-skeleton-agent-section-title" />
            <Block className="route-skeleton-agent-paragraph" />
            <Block className="route-skeleton-agent-paragraph route-skeleton-agent-paragraph-short" />
            <div className="route-skeleton-agent-setup-rows">{[0, 1, 2].map((item) => <Block key={item} />)}</div>
          </section>
          <section className="content-section route-skeleton-agent-section">
            <Block className="route-skeleton-agent-section-title" />
            <Block className="route-skeleton-agent-paragraph" />
            <Block className="route-skeleton-agent-paragraph route-skeleton-agent-paragraph-short" />
            <Block className="route-skeleton-agent-report-action" />
          </section>
          <section className="content-section route-skeleton-agent-section route-skeleton-agent-feedback">
            <Block className="route-skeleton-agent-section-title" />
            <div>{[0, 1].map((item) => <Block key={item} />)}</div>
          </section>
        </article>
        <aside className="route-skeleton-agent-sidebar">
          <Block className="route-skeleton-agent-sidebar-title" />
          {[0, 1, 2, 3, 4].map((item) => (
            <div className="route-skeleton-agent-permission" key={item}><Block /><Block /></div>
          ))}
        </aside>
      </div>
    </main>
  );
}

function FaqSkeleton() {
  return (
    <main id="main-content" className="page-shell faq-page route-skeleton route-skeleton-faq" aria-busy="true">
      <div className="container faq-directory">
        <header className="faq-directory-heading"><Block className="route-skeleton-title" /><Block className="route-skeleton-description" /><Block className="route-skeleton-description route-skeleton-description-short" /></header>
        <div className="route-skeleton-faq-search"><Block /></div>
        <div className="route-skeleton-faq-directory-layout">
          <aside className="route-skeleton-faq-nav">{[0, 1, 2, 3].map((item) => <Block key={item} />)}</aside>
          <div className="route-skeleton-faq-groups">{[0, 1, 2, 3].map((group) => <section key={group}><Block className="route-skeleton-faq-group-title" />{[0, 1, 2].map((item) => <Block className="route-skeleton-faq-question" key={item} />)}</section>)}</div>
          <aside className="route-skeleton-faq-index">{[0, 1, 2, 3, 4].map((item) => <Block key={item} />)}</aside>
        </div>
      </div>
    </main>
  );
}

function AboutSkeleton() {
  return (
    <main id="main-content" className="page-shell founder-page route-skeleton route-skeleton-about" aria-busy="true">
      <div className="container">
        <section className="founder-hero">
          <div className="founder-intro">
            <Block className="route-skeleton-eyebrow" />
            <Block className="route-skeleton-title" />
            <Block className="route-skeleton-description" />
            <Block className="route-skeleton-description route-skeleton-description-short" />
            <div className="route-skeleton-about-actions"><Block /><Block /></div>
          </div>
          <figure className="route-skeleton-portrait"><Block /><Block className="route-skeleton-portrait-caption" /></figure>
        </section>
        <section className="founder-team route-skeleton-about-team" aria-hidden="true">
          <header><Block className="route-skeleton-section-title" /></header>
          <div className="route-skeleton-team-grid">
            {[0, 1].map((item) => (
              <div key={item}>
                <Block className="route-skeleton-team-portrait" />
                <Block className="route-skeleton-team-name" />
                <Block className="route-skeleton-team-role" />
              </div>
            ))}
          </div>
        </section>
        <section className="about-editorial route-skeleton-about-editorial" aria-hidden="true">
          {[0, 1, 2, 3].map((item) => (
            <div className="route-skeleton-about-editorial-group" key={item}>
              <Block className="route-skeleton-prose-heading" />
              <Block className="route-skeleton-prose-line" />
              <Block className="route-skeleton-prose-line route-skeleton-prose-line-short" />
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

function ProseSkeleton({ variant }: { variant: "terms" | "privacy" | "cookies" | "refunds" | "delete-account" }) {
  const paragraphs = variant === "privacy" ? 8 : variant === "terms" ? 7 : variant === "delete-account" ? 0 : variant === "cookies" ? 3 : 2;
  return (
    <main id="main-content" className={`page-shell route-skeleton route-skeleton-prose route-skeleton-${variant}`} aria-busy="true">
      <div className="container prose-page">
        <Block className="route-skeleton-eyebrow" />
        <Block className="route-skeleton-title" />
        {variant === "delete-account" ? <><Block className="route-skeleton-description" /><Block className="route-skeleton-description route-skeleton-description-short" /><div className="route-skeleton-delete-form"><Block /><Block /></div></> : null}
        {variant === "terms" || variant === "privacy" ? <div className="route-skeleton-legal-notice"><Block /><Block /></div> : null}
        {paragraphs > 0 ? <div className="route-skeleton-prose-sections">{Array.from({ length: paragraphs }, (_, index) => <section key={index}><Block className="route-skeleton-prose-heading" /><Block className="route-skeleton-prose-line" /><Block className="route-skeleton-prose-line" /><Block className={index % 2 ? "route-skeleton-prose-line route-skeleton-prose-line-short" : "route-skeleton-prose-line"} /></section>)}</div> : null}
      </div>
    </main>
  );
}

function MethodologySkeleton() {
  return (
    <main id="main-content" className="page-shell route-skeleton route-skeleton-methodology" aria-busy="true">
      <div className="container trust-page">
        <PageHeading description />
        <div className="trust-methodology-grid">{[0, 1, 2].map((item) => <article className="trust-methodology-card" key={item}><Block className="route-skeleton-method-title" /><Block className="route-skeleton-prose-line" /><Block className="route-skeleton-prose-line" /><Block className="route-skeleton-prose-line route-skeleton-prose-line-short" /></article>)}</div>
        <div className="route-skeleton-method-actions"><Block /><Block /></div>
      </div>
    </main>
  );
}

function FormSkeleton({ variant }: { variant: "contact" | "join" | "recovery" | "reset" }) {
  return (
    <main id="main-content" className={`page-shell route-skeleton route-skeleton-${variant === "reset" ? "reset-password" : variant}`} aria-busy="true">
      <div className={`${variant === "recovery" || variant === "reset" ? "container auth-page-shell" : "container"} ${variant === "join" ? "join-page" : variant === "recovery" || variant === "reset" ? "" : "prose-page"}`}>
        {variant === "join" ? <><PageHeading description /><div className="route-skeleton-form route-skeleton-join-form"><Block /><div><Block /><Block /></div><div><Block /><Block /></div><Block className="route-skeleton-textarea" /><Block className="route-skeleton-submit" /></div></> : null}
        {variant === "contact" ? <><PageHeading description /><div className="route-skeleton-form route-skeleton-contact-form">{[0, 1, 2, 3].map((item) => <div key={item}><Block className="route-skeleton-field-label" /><Block className="route-skeleton-field" /></div>)}<div><Block className="route-skeleton-field-label" /><Block className="route-skeleton-textarea" /></div><Block className="route-skeleton-form-note" /><Block className="route-skeleton-submit" /></div></> : null}
        {variant === "recovery" || variant === "reset" ? <div className="auth-stage"><section className="auth-panel"><Block className="route-skeleton-title" /><div className="route-skeleton-recovery-form">{variant === "reset" ? <Block className="route-skeleton-reset-helper" /> : null}<Block className="route-skeleton-field-label" /><Block className="route-skeleton-field" />{variant === "reset" ? <><Block className="route-skeleton-field-label" /><Block className="route-skeleton-field" /></> : null}<Block className="route-skeleton-submit" /></div></section></div> : null}
      </div>
    </main>
  );
}

function AuthSkeleton() {
  return (
    <main id="main-content" className="page-shell auth-page-shell route-skeleton route-skeleton-auth" aria-busy="true">
      <div className="container">
        <div className="auth-stage">
          <section className="auth-panel"><Block className="route-skeleton-auth-title" /><div className="route-skeleton-auth-fields"><Block /><Block /><Block /><Block /></div><Block className="route-skeleton-submit" /></section>
        </div>
      </div>
    </main>
  );
}

function AccountSkeleton({ profile = false }: { profile?: boolean }) {
  return (
    <main id="main-content" className={`page-shell route-skeleton ${profile ? "route-skeleton-profile" : "route-skeleton-account"}`} aria-busy="true">
      <div className={`container ${profile ? "profile-page" : "account-page"}`}>
        <PageHeading description={profile} />
        {profile ? <ProfileCardSkeleton announce={false} /> : <><div className="route-skeleton-account-summary"><Block /><Block /></div><section className="account-section"><Block className="route-skeleton-section-title" /><div className="agent-grid"><Cards /></div></section></>}
      </div>
    </main>
  );
}

function AdminSkeleton() {
  return (
    <main id="main-content" className="page-shell route-skeleton route-skeleton-admin" aria-busy="true">
      <div className="container">
        <PageHeading description />
        <section className="route-skeleton-admin-inline" aria-hidden="true"><Block /><Block /><Block /></section>
      </div>
    </main>
  );
}

export function RouteLoadingSkeleton({ variant }: { variant: RouteSkeletonVariant }) {
  const content = {
    home: <HomeSkeleton />,
    search: <SearchSkeleton />,
    categories: <CategorySkeleton />,
    category: <CategorySkeleton detail />,
    agent: <AgentSkeleton />,
    faq: <FaqSkeleton />,
    about: <AboutSkeleton />,
    terms: <ProseSkeleton variant="terms" />,
    privacy: <ProseSkeleton variant="privacy" />,
    cookies: <ProseSkeleton variant="cookies" />,
    refunds: <ProseSkeleton variant="refunds" />,
    "delete-account": <ProseSkeleton variant="delete-account" />,
    methodology: <MethodologySkeleton />,
    contact: <FormSkeleton variant="contact" />,
    join: <FormSkeleton variant="join" />,
    recovery: <FormSkeleton variant="recovery" />,
    "reset-password": <FormSkeleton variant="reset" />,
    auth: <AuthSkeleton />,
    account: <AccountSkeleton />,
    profile: <AccountSkeleton profile />,
    admin: <AdminSkeleton />,
    compare: <CompareLoadingSkeleton />,
  } satisfies Record<RouteSkeletonVariant, ReactNode>;

  return <div role="status" aria-label="Loading page">{content[variant]}</div>;
}

export function getRouteSkeletonVariant(pathname: string): RouteSkeletonVariant | null {
  if (pathname === "/") return "home";
  if (pathname === "/search") return "search";
  if (pathname === "/categories") return "categories";
  if (pathname.startsWith("/categories/")) return "category";
  if (pathname.startsWith("/agents/")) return "agent";
  if (pathname === "/faq") return "faq";
  if (pathname === "/about") return "about";
  if (pathname === "/terms") return "terms";
  if (pathname === "/privacy") return "privacy";
  if (pathname === "/cookies") return "cookies";
  if (pathname === "/refunds") return "refunds";
  if (pathname === "/methodology") return "methodology";
  if (pathname === "/contact") return "contact";
  if (pathname === "/join") return "join";
  if (pathname === "/forgot-password") return "recovery";
  if (pathname === "/reset-password") return "reset-password";
  if (pathname === "/login" || pathname === "/signup") return "auth";
  if (pathname === "/account/delete") return "delete-account";
  if (pathname === "/account") return "account";
  if (pathname === "/profile") return "profile";
  if (pathname === "/admin") return "admin";
  if (pathname === "/compare") return "compare";
  return null;
}
