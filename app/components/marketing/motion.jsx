"use client";

import { cn } from "@/app/lib/utils";

/** Premium easing — Framer / Replit-style */
export const MKT_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

/** Fade + slide on mount — CSS-driven so content is never stuck invisible */
export function FadeIn({ children, className, delay = 0, y = 24 }) {
  return (
    <div
      className={cn("mkt-animate-fade-in", className)}
      style={{
        animationDelay: `${delay}s`,
        "--mkt-y": `${y}px`,
      }}
    >
      {children}
    </div>
  );
}

/** Scroll section reveal — CSS with intersection fallback via animation on mount */
export function ScrollReveal({ children, className, delay = 0, y = 32 }) {
  return (
    <div
      className={cn("mkt-animate-fade-in", className)}
      style={{
        animationDelay: `${delay}s`,
        "--mkt-y": `${y}px`,
      }}
    >
      {children}
    </div>
  );
}

/** Stagger children with incremental delay */
export function StaggerGroup({ children, className, baseDelay = 0, step = 0.1 }) {
  const items = [];

  if (Array.isArray(children)) {
    children.forEach((child, index) => {
      if (child) items.push({ child, index });
    });
  } else if (children) {
    items.push({ child: children, index: 0 });
  }

  return (
    <div className={className}>
      {items.map(({ child, index }) => (
        <FadeIn key={index} delay={baseDelay + index * step} y={20}>
          {child}
        </FadeIn>
      ))}
    </div>
  );
}
