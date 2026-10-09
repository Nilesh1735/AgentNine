"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type AuthPageShellProps = {
  title: string;
  children: ReactNode;
};

export function AuthPageShell({ title, children }: AuthPageShellProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="auth-stage">
      <motion.section
        className="auth-panel"
        initial={reduceMotion ? false : { opacity: 1, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: reduceMotion ? 0 : 0.08, ease: [0.16, 1, 0.3, 1] }}
        aria-labelledby="auth-title"
      >
        <h1 id="auth-title" className="auth-title">{title}</h1>
        {children}
      </motion.section>
    </div>
  );
}
