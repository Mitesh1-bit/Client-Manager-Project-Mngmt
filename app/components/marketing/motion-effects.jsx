"use client";

import { motion } from "framer-motion";

import { MKT_EASE, useMktMotion } from "./motion";

/** Floating ambient shape — continuous motion via framer */
export function FloatingOrb({ className, delay = 0, duration = 8 }) {
  const { animate } = useMktMotion();

  if (!animate) {
    return <div aria-hidden className={className} />;
  }

  return (
    <motion.div
      aria-hidden
      className={className}
      animate={{
        y: [0, -18, 0],
        x: [0, 10, 0],
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

/** Hover lift for bento cards */
export function HoverLift({ children, className }) {
  const { animate } = useMktMotion();

  if (!animate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.35, ease: MKT_EASE }}
    >
      {children}
    </motion.div>
  );
}
