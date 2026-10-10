import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SiteUtilities } from "@/components/SiteUtilities";
import { SITE_URL } from "@/lib/site";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = localFont({
  src: "../public/fonts/Fraunces-Variable.ttf",
  variable: "--font-fraunces",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AgentNine | Compare AI agent projects",
    template: "%s | AgentNine",
  },
  description: "Compare AI agent projects by source, setup requirements, and documented access.",
  applicationName: "AgentNine",
  creator: "AgentNine",
  publisher: "AgentNine",
  category: "technology",
  robots: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  openGraph: { title: "AgentNine | Compare AI agent projects", description: "Compare AI agent projects by source, setup requirements, and documented access.", type: "website", siteName: "AgentNine", images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "AgentNine | Compare AI agent projects" }], locale: "en_US" },
  twitter: { card: "summary_large_image", title: "AgentNine | Compare AI agent projects", description: "Compare AI agent projects by source, setup requirements, and documented access.", images: ["/og-image.png"] },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#ffffff" }, { media: "(prefers-color-scheme: dark)", color: "#090a0c" }],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      data-theme="light"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><a className="skip-link" href="#main-content">Skip to content</a><Header /><SiteUtilities />{children}<Footer /><Analytics /></body>
    </html>
  );
}
