"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useLayoutEffect, useState } from "react";

import { cn } from "@/app/lib/utils";

export const MKT_EASE = [0.16, 1, 0.3, 1];

/**
 * Avoid SSR/hydration mismatches. Marketing animations use CSS first so
 * content is always visible even when Framer Motion is blocked in Chrome.
 */
export function useMktMotion() {
  const [mounted, setMounted] = useState(false);
  const reduce = useReducedMotion();

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  return {
    mounted,
    reduce: Boolean(reduce),
    /** Post-hydration — enable CSS + motion enhancements */
    animate: mounted,
    /** Infinite loops on marketing showcase */
    loop: mounted,
  };
}

/**
 * SSR-safe Framer Motion props — visible in HTML before hydration, entrance after mount.
 * Fixes invisible sections on mobile when JS is slow or animations stall.
 */
export function getMktEntrance(mounted, { y = 20, x = 0, scale, delay = 0, duration = 0.65 } = {}) {
  const from = { opacity: 0, y, x };
  if (scale != null) {
    from.scale = scale;
  }
  return {
    initial: mounted ? from : false,
    animate: { opacity: 1, y: 0, x: 0, scale: 1 },
    transition: { duration, delay, ease: MKT_EASE },
  };
}

/** @deprecated use getMktEntrance — never animate to opacity:0 when !mounted */
export function mktPlayAnimate(mounted, play, visible, _hidden) {
  return mounted && play ? visible : visible;
}

export const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.08, ease: MKT_EASE },
  }),
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i = 0) => ({
    opacity: 1,
    transition: { duration: 0.6, delay: i * 0.06, ease: MKT_EASE },
  }),
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.65, delay: i * 0.07, ease: MKT_EASE },
  }),
};

export const slideFromRight = {
  hidden: { opacity: 0, x: 48 },
  visible: (i = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.75, delay: i * 0.08, ease: MKT_EASE },
  }),
};

export function ScrollReveal({ children, className, delay = 0, y = 24 }) {
  return (
    <div
      className={cn("mkt-animate-fade-in", className)}
      style={{ "--mkt-y": `${y}px`, animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function FadeIn({ children, className, delay = 0 }) {
  return (
    <ScrollReveal className={className} delay={delay} y={16}>
      {children}
    </ScrollReveal>
  );
}

export function StaggerGroup({ children, className, stagger = 0.08 }) {
  const { animate } = useMktMotion();

  if (!animate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={false}
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.div>
  );
}

/** CSS-first reveal — content always visible; animates when mounted */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
  x = 0,
}) {
  const { mounted } = useMktMotion();

  return (
    <div
      className={cn(className, mounted && "mkt-animate-fade-in")}
      style={
        mounted
          ? {
              "--mkt-y": `${y}px`,
              "--mkt-x": `${x}px`,
              animationDelay: `${Math.round(delay * 1000)}ms`,
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

export function useMktInView(ref, options = {}) {
  return useInView(ref, {
    once: true,
    amount: 0.15,
    margin: "0px 0px -40px 0px",
    ...options,
  });
}
