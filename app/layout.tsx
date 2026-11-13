import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SiteUtilities } from "@/components/SiteUtilities";
import { CortalityRouteBoundary } from "@/components/CortalityReplay";
import { SITE_URL } from "@/lib/site";
import { THEME_BOOT_SCRIPT } from "@/lib/theme-boot";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AgentNine | Compare AI agent projects",
    template: "%s | AgentNine",
  },
  description: "Find open-source AI agents in AgentNine's directory. Browse by category, compare listings, and review setup guides, source links, and access details.",
  keywords: [
    "open-source AI agents",
    "AI agent directory",
    "AI agent listings",
    "AI agent catalog",
    "AI agent search",
    "compare AI agents",
    "AI agents by category",
    "AI agent setup guides",
    "AI agent requirements",
    "AI agent access details",
    "open-source AI tools",
  ],
  applicationName: "AgentNine",
  creator: "AgentNine",
  publisher: "AgentNine",
  category: "technology",
  robots: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  openGraph: { title: "AgentNine | Open-source AI agent directory", description: "Find open-source AI agents in AgentNine's directory. Browse by category, compare listings, and review setup guides, source links, and access details.", type: "website", siteName: "AgentNine", images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "AgentNine | Open-source AI agent directory" }], locale: "en_US" },
  twitter: { card: "summary_large_image", title: "AgentNine | Open-source AI agent directory", description: "Find open-source AI agents in AgentNine's directory. Browse by category, compare listings, and review setup guides, source links, and access details.", images: ["/og-image.png"] },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#ffffff" }, { media: "(prefers-color-scheme: dark)", color: "#090a0c" }],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // data-theme carries a server default so the attribute is never absent: six
  // [data-theme="light"] rules in globals.css depend on it, and a visitor without
  // JavaScript would otherwise get no theme attribute at all. THEME_BOOT_SCRIPT
  // overwrites it before first paint, so a dark visitor still sees no flash.
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      data-theme="light"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col"><CortalityRouteBoundary><a className="skip-link" href="#main-content">Skip to content</a><Header /><SiteUtilities />{children}<Footer /></CortalityRouteBoundary></body>
    </html>
  );
}
