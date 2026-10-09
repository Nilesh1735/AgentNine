export function ProfileCardSkeleton({ announce = true }: { announce?: boolean } = {}) {
  return (
    <section
      className="profile-card route-skeleton-profile-card"
      {...(announce ? { role: "status" as const, "aria-label": "Loading profile" } : { "aria-hidden": true as const })}
    >
      <div className="profile-card-identity route-skeleton-profile-identity" aria-hidden="true">
        <span className="route-skeleton-block route-skeleton-profile-avatar" />
        <div><span className="route-skeleton-block" /><span className="route-skeleton-block" /><span className="route-skeleton-block" /></div>
      </div>
      <div className="profile-card-actions route-skeleton-profile-actions" aria-hidden="true"><span className="route-skeleton-block" /><span className="route-skeleton-block" /></div>
    </section>
  );
}
