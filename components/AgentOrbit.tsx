"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import ArrowUpRight from "reicon-react/icons/ArrowUpRight";
import type { Agent, Category } from "@/lib/types";

export function AgentOrbit({ agents, categories }: { agents: Agent[]; categories: Category[] }) {
  const reduceMotion = useReducedMotion();
  const categoryById = new Map(categories.map((category) => [category.id, category.name]));
  const orbitAgents = agents.slice(0, 4);

  if (!orbitAgents.length) return null;

  return (
    <div className="agent-orbit" aria-label="Featured agents">
      <div className="agent-orbit-head">
        <span>Featured agents</span>
        <Link href="/search">Browse all agents <ArrowUpRight size={14} aria-hidden="true" /></Link>
      </div>
      <div className="agent-orbit-window">
        <div className="agent-orbit-track" aria-hidden="true" />
        {orbitAgents.map((agent, index) => {
          const angle = index * (360 / orbitAgents.length) - 45;
          const category = categoryById.get(agent.category_id) ?? "AI agent";
          return (
            <motion.div
              className="agent-orbit-position"
              key={agent.id}
              style={{ "--orbit-angle": `${angle}deg` } as React.CSSProperties}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
            >
              <article className="agent-orbit-card">
                <div className="agent-orbit-card-top">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span>{category}</span>
                </div>
                <Link href={`/agents/${agent.slug}`} className="agent-orbit-card-title">
                  <strong>{agent.name}</strong>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
                <p>{agent.short_description}</p>
                <div className="agent-orbit-card-bottom">
                  <span>{agent.version_tag || "Version pending"}</span>
                  <span className={agent.verification_score === 5 ? "is-verified" : ""}>
                    {agent.verification_score === 5 ? "5 checks" : "Not checked"}
                  </span>
                </div>
              </article>
            </motion.div>
          );
        })}
        <motion.div
          className="agent-orbit-core"
          animate={reduceMotion ? undefined : { scale: [1, 1.04, 1] }}
          transition={reduceMotion ? undefined : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        >
          <span>AGENTNINE</span>
          <small>OPEN-SOURCE INDEX</small>
        </motion.div>
      </div>
    </div>
  );
}
