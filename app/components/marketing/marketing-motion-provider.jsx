"use client";

import { MotionConfig } from "framer-motion";

/** Framer Motion respects OS reduced-motion in Chrome; force animations on marketing pages. */
export function MarketingMotionProvider({ children }) {
  return <MotionConfig reducedMotion="never">{children}</MotionConfig>;
}
