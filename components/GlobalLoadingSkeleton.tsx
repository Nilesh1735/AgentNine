"use client";

import { usePathname } from "next/navigation";
import { getRouteSkeletonVariant, RouteLoadingSkeleton } from "@/components/RouteLoadingSkeleton";

function Block({ className = "" }: { className?: string }) {
  return <span className={`route-skeleton-block ${className}`} aria-hidden="true" />;
}

export function GlobalLoadingSkeleton() {
  const pathname = usePathname();
  const variant = pathname ? getRouteSkeletonVariant(pathname) : null;

  if (variant) {
    return <RouteLoadingSkeleton variant={variant} />;
  }

  return (
    <main id="main-content" className="page-shell route-skeleton" aria-busy="true">
      <span className="sr-only" role="status">Loading page</span>
      <div className="container">
        <header className="route-skeleton-heading">
          <Block className="route-skeleton-eyebrow" />
          <Block className="route-skeleton-title" />
          <Block className="route-skeleton-description" />
        </header>
      </div>
    </main>
  );
}
