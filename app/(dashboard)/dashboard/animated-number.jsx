"use client";

import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "framer-motion";

/**
 * Counts up to `value` on mount. Server-rendered text is the final number
 * (so it's correct before hydration and with JS disabled) — the effect then
 * animates from 0 up to it. Reduced-motion users skip the animation entirely.
 *
 * @param {{ value: number, className?: string }} props
 */
export function AnimatedNumber({ value = 0, className }) {
  const nodeRef = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    if (reduce) {
      node.textContent = value.toLocaleString();
      return;
    }

    const controls = animate(0, value, {
      duration: 0.8,
      ease: "easeOut",
      onUpdate(latest) {
        node.textContent = Math.round(latest).toLocaleString();
      },
    });
    return () => controls.stop();
  }, [value, reduce]);

  return (
    <span ref={nodeRef} className={className}>
      {value.toLocaleString()}
    </span>
  );
}
