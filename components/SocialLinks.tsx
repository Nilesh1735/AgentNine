import type { ReactNode } from "react";

export type SocialPlatform = "GitHub" | "LinkedIn" | "X" | "Instagram" | "Facebook";

export interface SocialLink {
  platform: SocialPlatform;
  href: string;
}

const socialIcons: Record<SocialPlatform, ReactNode> = {
  GitHub: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.05-1.61-4.05-1.61-.55-1.4-1.33-1.77-1.33-1.77-1.09-.75.08-.74.08-.74 1.2.08 1.83 1.23 1.83 1.23 1.07 1.83 2.8 1.3 3.48.99.11-.77.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.17 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23.65 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.22 0 4.62-2.8 5.64-5.48 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .5Z" />
    </svg>
  ),
  LinkedIn: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.59 0 4.27 2.36 4.27 5.43v6.31ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
    </svg>
  ),
  X: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.48l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93Zm-1.29 19.49h2.04L6.49 3.24H4.3l13.31 17.4Z" />
    </svg>
  ),
  Instagram: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <rect x="1.6" y="1.6" width="20.8" height="20.8" rx="5.4" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.3" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.6" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  ),
  Facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M13.5 24V13.1h3.66l.55-4.25H13.5V6.14c0-1.23.34-2.07 2.11-2.07h2.25V.27C17.47.1 16.23 0 14.8 0c-3.54 0-5.97 2.16-5.97 6.12v2.73H5.12v4.25h3.71V24h4.67Z" />
    </svg>
  ),
};

const platformClasses: Record<SocialPlatform, string> = {
  GitHub: "social-link-github",
  LinkedIn: "social-link-linkedin",
  X: "social-link-x",
  Instagram: "social-link-instagram",
  Facebook: "social-link-facebook",
};

export function SocialLinks({
  links,
  label,
  className = "",
}: {
  links: readonly SocialLink[];
  label: string;
  className?: string;
}) {
  return (
    <nav className={`social-links ${className}`.trim()} aria-label={label}>
      {links.map(({ platform, href }) => (
        <a
          key={platform}
          className={`social-link ${platformClasses[platform]}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${label}: ${platform}`}
        >
          {socialIcons[platform]}
        </a>
      ))}
    </nav>
  );
}
