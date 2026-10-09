"use client";

import { useEffect, useState, type CSSProperties, type MouseEventHandler, type ReactNode } from "react";

type Theme = "light" | "dark";

export function RectangleButtons({
  children,
  href,
  className,
  onClick,
  ariaCurrent,
  style,
}: {
  children: ReactNode;
  href: string;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  ariaCurrent?: "page";
  style?: CSSProperties;
}) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setTheme(root.dataset.theme === "light" ? "light" : "dark");
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return (
    <a className={`rectangle-button-stage${className ? ` ${className}` : ""}`} data-mode={theme} href={href} onClick={onClick} aria-current={ariaCurrent} style={style}>
      <span className="rectangle-button">
        <span className="rectangle-button__title">{children}</span>
        <span className="rectangle-button__circle" aria-hidden="true" />
      </span>
    </a>
  );
}
