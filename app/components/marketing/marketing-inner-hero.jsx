"use client";

import { motion } from "framer-motion";

import { GridTexture } from "./grid-texture";
import { MKT_EASE, useMktMotion } from "./motion";

/** Animated hero band for inner marketing pages */
export function MarketingInnerHero({ title, description, breadcrumb, tone = "sky" }) {
  const { animate } = useMktMotion();

  const inner = (
    <>
      <GridTexture tone={tone} className="opacity-30" />
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
        {breadcrumb ? (
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-mkt-navy/60">
            {breadcrumb}
          </nav>
        ) : null}
        <h1 className="font-mkt-display text-[clamp(2rem,4vw,3.5rem)] leading-tight text-mkt-navy">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-mkt-navy/75">{description}</p>
        ) : null}
      </div>
    </>
  );

  if (!animate) {
    return (
      <div className="relative overflow-hidden border-b border-mkt-navy/10 bg-gradient-to-br from-mkt-sun/15 via-white to-mkt-sky/10">
        {inner}
      </div>
    );
  }

  return (
    <motion.div
      className="relative overflow-hidden border-b border-mkt-navy/10 bg-gradient-to-br from-mkt-sun/15 via-white to-mkt-sky/10"
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: MKT_EASE }}
    >
      {inner}
    </motion.div>
  );
}
