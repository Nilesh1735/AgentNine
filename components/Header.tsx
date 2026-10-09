"use client";

import Link from "next/link";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import ChevronDown from "reicon-react/icons/ChevronDown";
import Menu from "reicon-react/icons/Menu";
import Xmark from "reicon-react/icons/Xmark";
import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

function ProfileMenu({ email, onSignedOut }: { email: string; onSignedOut: () => void }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const closeOnPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnKeyDown);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnKeyDown);
    };
  }, [open]);

  async function signOut() {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    const result = await supabase.auth.signOut();
    if (result.error) return;
    setOpen(false);
    onSignedOut();
    router.push("/");
    router.refresh();
  }

  const initials = email.slice(0, 2).toUpperCase();
  return (
    <div ref={menuRef} className="profile-menu">
      <button
        type="button"
        className="profile-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Open profile menu for ${email}`}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="profile-avatar" aria-hidden="true">{initials}</span>
        <span className="profile-trigger-label">Profile</span>
        <ChevronDown className="profile-chevron" size={14} aria-hidden="true" />
      </button>
      {open ? (
        <div className="profile-popover" role="menu">
          <div className="profile-popover-heading">
            <span className="profile-avatar profile-avatar-large" aria-hidden="true">{initials}</span>
            <div>
              <strong>AgentNine account</strong>
              <span>{email}</span>
            </div>
          </div>
          <div className="profile-menu-links">
            <Link href="/profile" role="menuitem" onClick={() => setOpen(false)}>Profile</Link>
            <Link href="/account" role="menuitem" onClick={() => setOpen(false)}>Saved agents</Link>
            <Link href="/account/delete" role="menuitem" onClick={() => setOpen(false)}>Delete account</Link>
          </div>
          <button type="button" className="profile-signout" role="menuitem" onClick={() => void signOut()}>Sign out</button>
        </div>
      ) : null}
    </div>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const navigationRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => {
      setSignedIn(Boolean(data.user));
      setUserEmail(data.user?.email ?? "");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user));
      setUserEmail(session?.user?.email ?? "");
    });
    return () => listener.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (event.key === "Tab") {
        const focusable = navigationRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])");
        if (!focusable?.length) return;
        const firstLink = focusable[0];
        const lastLink = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === firstLink) {
          event.preventDefault();
          lastLink.focus();
        } else if (!event.shiftKey && document.activeElement === lastLink) {
          event.preventDefault();
          firstLink.focus();
        }
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    firstLinkRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);
  const closeMenu = () => setOpen(false);
  const handleBrandClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      pathname !== "/" ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      (event.currentTarget.target && event.currentTarget.target !== "_self") ||
      window.location.search ||
      window.location.hash
    ) {
      return;
    }

    event.preventDefault();
    if (window.scrollY > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  return (
    <header ref={headerRef} className="site-header">
      <div className="container nav-row">
        <Link href="/" className="brand" aria-label="AgentNine home" onClick={handleBrandClick}>
          <BrandMark />
          <span>AgentNine</span>
        </Link>
        <nav ref={navigationRef} id="main-navigation" className={`desktop-nav${open ? " mobile-nav-open" : ""}`} aria-label="Main navigation">
          <div className="nav-primary-links">
            <Link ref={firstLinkRef} href="/search" onClick={closeMenu} aria-current={pathname.startsWith("/search") ? "page" : undefined}>Browse agents</Link>
            <Link href="/categories" onClick={closeMenu} aria-current={pathname.startsWith("/categories") ? "page" : undefined}>Categories</Link>
            <Link href="/faq" onClick={closeMenu} aria-current={pathname.startsWith("/faq") ? "page" : undefined}>FAQ</Link>
            <Link href="/about" onClick={closeMenu} aria-current={pathname.startsWith("/about") ? "page" : undefined}>About</Link>
          </div>
        </nav>
        <div className="nav-utility">
          <ThemeToggle />
          <div className="nav-account-links">
            {signedIn ? (
              <ProfileMenu email={userEmail || "Signed-in user"} onSignedOut={() => { setSignedIn(false); setUserEmail(""); }} />
            ) : (
              <Link href="/login" className="nav-login-link" aria-current={pathname.startsWith("/login") ? "page" : undefined}>
                Log in
              </Link>
            )}
          </div>
        </div>
        <button ref={menuButtonRef} type="button" className={`menu-button${open ? " is-open" : ""}`} aria-expanded={open} aria-controls="main-navigation" aria-label={open ? "Close navigation menu" : "Open navigation menu"} onClick={() => setOpen(!open)}>{open ? <Xmark size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}</button>
      </div>
    </header>
  );
}
