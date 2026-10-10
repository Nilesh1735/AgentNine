"use client";

import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SocialLinks, type SocialLink } from "@/components/SocialLinks";
import { cn } from "@/lib/utils";

export interface TeamRevealMember {

  id: string;
  name: string;
  role: string;
  expertise: string;

  image?: string;
  imageAlt?: string;

  imagePosition?: string;

  accent?: string;
  profileSize?: "compact";
  socialLinks?: readonly SocialLink[];
}

export interface TeamRevealGridProps
  extends Omit<React.ComponentPropsWithoutRef<"section">, "title"> {
  title?: string;
  description?: string;
  members: readonly TeamRevealMember[];

  activeMemberId?: string | null;

  defaultActiveMemberId?: string | null;
  onActiveMemberChange?: (memberId: string | null) => void;

  autoPlay?: boolean;
  rotationInterval?: number;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function Portrait({ member, active, compact }: { member: TeamRevealMember; active: boolean; compact: boolean }) {
  const style = {
    "--team-accent": member.accent ?? "var(--blue)",
  } as React.CSSProperties;

  return (
    <div
      style={style}
      className={cn(
        "relative overflow-hidden rounded-[1.05rem] bg-neutral-100 transition-colors duration-500 dark:bg-neutral-900",
        active && "bg-[color-mix(in_srgb,var(--team-accent)_10%,white)] dark:bg-[color-mix(in_srgb,var(--team-accent)_13%,#0a0a0a)]",
        compact && "aspect-square",
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 opacity-55 transition-opacity duration-500",
          active && "opacity-100",
        )}
        style={{
          background:
            "radial-gradient(circle at 68% 20%, color-mix(in srgb, var(--team-accent) 36%, transparent), transparent 36%), radial-gradient(circle at 22% 82%, color-mix(in srgb, var(--team-accent) 16%, transparent), transparent 42%)",
        }}
      />

      {member.image ? (

        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.image}
          alt={member.imageAlt ?? member.name}
          loading="lazy"
          draggable={false}
          className={cn(
            "relative block grayscale transition-[filter,opacity] duration-500 ease-out motion-reduce:transition-none",
            compact ? "absolute inset-0 h-full w-full object-cover" : "h-auto w-full object-contain",
            active ? "grayscale-0" : "grayscale",
          )}
          style={{ objectPosition: member.imagePosition ?? "center top" }}
        />
      ) : (
        <div className={cn("relative w-full overflow-hidden", compact ? "aspect-square" : "aspect-[3/4]")}>
          <div
            aria-hidden="true"
            className={cn(
              "absolute top-[13%] aspect-square h-[36%] rounded-full bg-neutral-300 transition-[transform,background-color] duration-500 dark:bg-neutral-700",
              active && "-translate-y-0.5 scale-105 bg-[var(--team-accent)]",
            )}
          />
          <div
            aria-hidden="true"
            className={cn(
              "absolute -bottom-[12%] h-[66%] w-[82%] rounded-t-[48%] bg-neutral-300/90 transition-[transform,background-color] duration-500 dark:bg-neutral-700/90",
              active && "scale-105 bg-[var(--team-accent)]",
            )}
          />
          <span className="absolute inset-x-0 bottom-[18%] z-10 text-center text-2xl font-semibold tracking-[-0.08em] text-white mix-blend-difference">
            {initials(member.name)}
          </span>
        </div>
      )}
    </div>
  );
}

export function TeamRevealGrid({
  title = "The team",
  description = "",
  members,
  activeMemberId,
  defaultActiveMemberId,
  onActiveMemberChange,
  autoPlay = false,
  rotationInterval = 2800,
  className,
  ...props
}: TeamRevealGridProps) {
  const firstMemberId = members[0]?.id ?? null;
  const [internalActiveId, setInternalActiveId] = useState<string | null>(
    defaultActiveMemberId === undefined ? firstMemberId : defaultActiveMemberId,
  );
  const [interacting, setInteracting] = useState(false);
  const isControlled = activeMemberId !== undefined;

  const memberIds = useMemo(() => new Set(members.map((member) => member.id)), [members]);
  const requestedActiveId = isControlled ? activeMemberId : internalActiveId;
  const resolvedActiveId = requestedActiveId === null
    ? null
    : requestedActiveId && memberIds.has(requestedActiveId)
      ? requestedActiveId
      : firstMemberId;

  const selectMember = useCallback(
    (memberId: string | null) => {
      if (!isControlled) setInternalActiveId(memberId);
      onActiveMemberChange?.(memberId);
    },
    [isControlled, onActiveMemberChange],
  );

  useEffect(() => {
    if (!autoPlay || interacting || members.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      const currentIndex = members.findIndex((member) => member.id === resolvedActiveId);
      const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % members.length;
      selectMember(members[nextIndex]?.id ?? null);
    }, Math.max(rotationInterval, 1200));

    return () => window.clearInterval(timer);
  }, [autoPlay, interacting, members, resolvedActiveId, rotationInterval, selectMember]);

  return (
    <section
      className={cn(
        "@container relative w-full bg-transparent px-0 py-0 text-[var(--ink)]",
        className,
      )}
      {...props}
    >
      <div className="relative w-full max-w-5xl">
        <header className="mb-7 max-w-[65ch] text-left">
          <h2 className="text-balance text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-3 max-w-xl text-pretty text-sm leading-6 text-[var(--muted)]">
              {description}
            </p>
          ) : null}
        </header>

        <ul className={cn(
          "grid gap-x-3 gap-y-6 @min-[560px]:gap-x-5 @min-[560px]:gap-y-5",
          members.length === 1
            ? "max-w-[280px] grid-cols-1"
            : "grid-cols-2 @min-[560px]:grid-cols-3",
        )}>
          {members.map((member) => {
            const active = member.id === resolvedActiveId;
            const detailsId = `team-member-${member.id}-details`;

            return (
              <li
                key={member.id}
                className={cn(
                  "relative min-w-0",
                  member.profileSize === "compact" && "row-start-2 col-start-1 w-[clamp(124px,18vw,220px)] max-w-full justify-self-start",
                )}
              >
                <button
                  type="button"
                  aria-expanded={active}
                  aria-controls={detailsId}
                  onClick={() => selectMember(member.id)}
                  onPointerEnter={(event) => {
                    if (event.pointerType === "mouse") {
                      setInteracting(true);
                      selectMember(member.id);
                    }
                  }}
                  onPointerLeave={(event) => {
                    if (event.pointerType === "mouse") {
                      setInteracting(false);
                      if (!event.currentTarget.matches(":focus-visible")) {
                        selectMember(null);
                      }
                    }
                  }}
                  onFocus={() => {
                    setInteracting(true);
                    selectMember(member.id);
                  }}
                  onBlur={(event) => {
                    setInteracting(false);
                    if (!event.currentTarget.matches(":hover")) {
                      selectMember(null);
                    }
                  }}
                  style={{ "--team-accent": member.accent ?? "var(--blue)" } as React.CSSProperties}
                  className="group block w-full rounded-[var(--radius-lg)] text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--team-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)]"
                >
                  <div
                    className={cn(
                      "overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] p-1.5 shadow-[0_10px_35px_-24px_rgba(0,0,0,0.42)] transition-[border-color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
                      active
                        ? "-translate-y-1 border-[color-mix(in_srgb,var(--team-accent)_55%,transparent)] shadow-[0_22px_48px_-28px_color-mix(in_srgb,var(--team-accent)_55%,transparent)]"
                        : "border-black/10 dark:border-white/10",
                    )}
                  >
                    <Portrait member={member} active={active} compact={member.profileSize === "compact"} />

                    <div
                      id={detailsId}
                      aria-hidden={!active}
                      className={cn(
                        "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
                        active ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                      )}
                    >
                      <div className="min-h-0 overflow-hidden">
                        <p className="px-3 pt-3 pb-1 text-xs leading-relaxed text-[var(--muted)]">
                          {member.expertise}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="px-1.5 pt-3 text-center">
                    <h3 className="truncate text-sm font-semibold tracking-tight @min-[560px]:text-base">
                      {member.name}
                    </h3>
                    <p
                      className={cn(
                        "mt-0.5 truncate text-xs text-neutral-500 transition-colors duration-300 dark:text-neutral-400",
                        active && "text-[var(--team-accent)] dark:text-[var(--team-accent)]",
                      )}
                    >
                      {member.role}
                    </p>
                  </div>
                </button>
                {member.socialLinks?.length ? (
                  <SocialLinks
                    links={member.socialLinks}
                    label={`${member.name} social profiles`}
                    className="team-social-links"
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default TeamRevealGrid;
