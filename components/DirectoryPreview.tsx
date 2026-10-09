"use client";

import Link from "next/link";
import { motion, useAnimationControls, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef } from "react";
import ArrowUpRight from "reicon-react/icons/ArrowUpRight";
import type { Agent, Category } from "@/lib/types";
import { AgentArtwork } from "@/components/AgentArtwork";

export function DirectoryPreview({ agents, categories }: { agents: Agent[]; categories: Category[] }) {
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const collection = agents.slice(0, 40);
  const ringCollection = [...collection, ...collection];
  const loopDuration = Math.max(120, collection.length * 2);
  const controls = useAnimationControls();
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<number | null>(null);

  const startRing = useCallback(() => {
    if (reduceMotion || collection.length < 2 || isScrollingRef.current) return;
    controls.start({
      x: "-50%",
      transition: { duration: loopDuration, ease: "linear", repeat: Infinity },
    });
  }, [collection.length, controls, loopDuration, reduceMotion]);

  const pauseRing = useCallback(() => {
    if (!reduceMotion) controls.stop();
  }, [controls, reduceMotion]);

  const resumeRing = useCallback(() => {
    const section = sectionRef.current;
    if (
      reduceMotion ||
      isScrollingRef.current ||
      section?.matches(":hover") ||
      section?.contains(document.activeElement)
    ) {
      return;
    }
    startRing();
  }, [reduceMotion, startRing]);

  useEffect(() => {
    startRing();
    return () => controls.stop();
  }, [controls, startRing]);

  useEffect(() => {
    if (reduceMotion || collection.length < 2) return;

    const handleScroll = () => {
      isScrollingRef.current = true;
      controls.stop();
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = window.setTimeout(() => {
        scrollTimeoutRef.current = null;
        isScrollingRef.current = false;
        resumeRing();
      }, 180);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
      isScrollingRef.current = false;
    };
  }, [collection.length, controls, reduceMotion, resumeRing]);

  if (!collection.length) return null;

  return (
    <section ref={sectionRef} className="agent-ring" aria-label="Agent directory preview" onMouseEnter={pauseRing} onMouseLeave={resumeRing} onFocus={pauseRing} onBlur={resumeRing}>
      <div className="agent-ring-head">
        <Link href="/search">Browse all agents <ArrowUpRight size={14} aria-hidden="true" /></Link>
      </div>
      <div className="agent-ring-window">
        <div className="agent-ring-guide agent-ring-guide-back" aria-hidden="true" />
        <div className="agent-ring-guide agent-ring-guide-front" aria-hidden="true" />
        <motion.div className="agent-ring-track" animate={reduceMotion ? { x: 0 } : controls}>
          {ringCollection.map((agent, index) => {
            const category = categoryById.get(agent.category_id);
            const displayIndex = index % collection.length;
            return (
              <motion.article
                className="agent-ring-card"
                key={`${agent.id}-${index}`}
                data-index={String(displayIndex + 1).padStart(2, "0")}
                whileHover={reduceMotion ? undefined : { y: -4 }}
              >
                <div className="agent-ring-card-top">
                  <span>{String(displayIndex + 1).padStart(2, "0")}</span>
                  <span>{category?.name ?? "AI agent"}</span>
                </div>
                <AgentArtwork seed={agent.slug} categorySlug={category?.slug} />
                <Link href={`/agents/${agent.slug}`} prefetch={false} className="agent-ring-card-title">
                  <strong>{agent.name}</strong>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
                <p>{agent.short_description}</p>
                <div className="agent-ring-card-bottom">
                  <span>{agent.version_tag || "Version pending"}</span>
                  <span className={agent.verification_score === 5 ? "is-verified" : ""}>
                    {agent.verification_score === 5 ? "Verified" : "Indexed"}
                  </span>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
        <div className="agent-ring-core" aria-hidden="true"><span>AGENTNINE</span><small>OPEN-SOURCE INDEX</small></div>
      </div>
    </section>
  );
}
