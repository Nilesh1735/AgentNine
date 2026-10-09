"use client";

import type { ReactNode, PointerEvent } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";

export function FounderPortraitMotion({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  const targetRotateX = useMotionValue(0);
  const targetRotateY = useMotionValue(0);
  const rotateX = useSpring(targetRotateX, { damping: 24, stiffness: 180, mass: 0.6 });
  const rotateY = useSpring(targetRotateY, { damping: 24, stiffness: 180, mass: 0.6 });

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (reduceMotion || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    targetRotateX.set((0.5 - y) * 12);
    targetRotateY.set((x - 0.5) * 12);
  }

  function resetTilt() {
    targetRotateX.set(0);
    targetRotateY.set(0);
  }

  return (
    <motion.div
      style={{
        rotateX,
        rotateY,
        transformPerspective: 1000,
        transformStyle: "preserve-3d",
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
    >
      {children}
    </motion.div>
  );
}
