"use client";

import Lenis from "lenis";
import { useEffect } from "react";

function shouldUseLenis() {
  if (typeof window === "undefined") return false;

  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    // Native touch scroll is more reliable on phones (iOS Safari + Lenis conflict).
    if (window.matchMedia("(max-width: 1023px), (pointer: coarse)").matches) return false;
  } catch {
    return false;
  }

  return true;
}

/** Smooth scroll for marketing pages — desktop only; mobile uses native scroll */
export function MarketingSmoothScroll({ children }) {
  useEffect(() => {
    if (!shouldUseLenis()) return undefined;

    let lenis;
    let frame = 0;

    try {
      lenis = new Lenis({
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.2,
      });
    } catch {
      return undefined;
    }

    function raf(time) {
      lenis?.raf(time);
      frame = requestAnimationFrame(raf);
    }
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      try {
        lenis?.destroy();
      } catch {
        /* ignore */
      }
    };
  }, []);

  return children;
}
