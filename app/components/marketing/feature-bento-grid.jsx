"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { cn } from "@/app/lib/utils";

import {
  ChangeControlIllustration,
  PipelineIllustration,
  PortalIllustration,
} from "./feature-illustrations";
import { InteractiveGrid } from "./interactive-grid";
import { HoverLift } from "./motion-effects";
import { MKT_EASE, Reveal, useMktMotion } from "./motion";

const TONE = {
  lime: { bg: "bg-mkt-block-lime/35", fill: "#c5f042", stroke: "rgba(10, 21, 80, 0.1)" },
  coral: { bg: "bg-mkt-block-coral/30", fill: "#ff8a7a", stroke: "rgba(10, 21, 80, 0.1)" },
  sky: { bg: "bg-mkt-block-sky/35", fill: "#7dd3fc", stroke: "rgba(10, 21, 80, 0.1)" },
};

const ILLUSTRATIONS = {
  agents: ChangeControlIllustration,
  pipelines: PipelineIllustration,
  portal: PortalIllustration,
};

function AnimatedVisual({ illustration, tone }) {
  const { mounted } = useMktMotion();
  const Illustration = ILLUSTRATIONS[illustration] || ChangeControlIllustration;
  const t = TONE[tone] || TONE.lime;

  return (
    <div className={cn("relative mx-4 flex flex-1 flex-col overflow-hidden rounded-xl md:mx-6", t.bg)}>
      {/* Mini interactive grid behind illustration */}
      {mounted ? (
        <div className="absolute inset-0 flex items-center justify-center opacity-40">
          <InteractiveGrid
            cols={10}
            rows={7}
            cellSize={18}
            fill={t.fill}
            stroke={t.stroke}
            radius={48}
            fadeSpeed={0.18}
            className="pointer-events-auto"
          />
        </div>
      ) : null}

      <div className="relative z-10 flex flex-1 items-center justify-center py-10">
        <motion.div
          className="w-full px-4"
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.35, ease: MKT_EASE }}
        >
          <Illustration />
        </motion.div>
      </div>

      {/* Animated scan line */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-mkt-navy/30 to-transparent"
        animate={{ top: ["0%", "100%", "0%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

function FeatureCard({ feature, index }) {
  const { animate } = useMktMotion();
  const tone = feature.tone || "lime";

  const cardClass =
    "group relative flex h-full min-h-[320px] flex-col overflow-hidden rounded-2xl border border-mkt-navy/8 bg-white transition-shadow duration-500 hover:border-mkt-navy/20 hover:shadow-2xl hover:shadow-mkt-navy/10 sm:min-h-[380px] md:min-h-[440px]";

  const body = (
    <>
      <div className="p-6 pb-4 md:p-8">
        <motion.div
          className="mb-3 h-1 w-8 rounded-full bg-mkt-cta"
          initial={{ width: 0 }}
          whileInView={{ width: 32 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.1, ease: MKT_EASE }}
        />
        <h3 className="font-mkt-display text-xl text-mkt-navy sm:text-2xl md:text-3xl">{feature.title}</h3>
      </div>

      <AnimatedVisual illustration={feature.illustration} tone={tone} />

      <div className="p-6 pt-4 md:p-8">
        <p className="text-sm leading-relaxed text-mkt-navy/70">{feature.description}</p>
        {feature.href ? (
          <Link
            href={feature.href}
            className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-mkt-navy transition-all group-hover:gap-2 group-hover:text-mkt-cta"
          >
            Learn more
            <motion.span aria-hidden animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
              →
            </motion.span>
          </Link>
        ) : null}
      </div>
    </>
  );

  return (
    <HoverLift>
      {animate ? (
        <motion.article
          className={cardClass}
          initial={{ opacity: 0, y: 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7, delay: index * 0.12, ease: MKT_EASE }}
        >
          {body}
        </motion.article>
      ) : (
        <article className={cardClass}>{body}</article>
      )}
    </HoverLift>
  );
}

export function FeatureBentoGrid({ features, title, subtitle }) {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-mkt-display text-3xl text-mkt-navy md:text-5xl">{title}</h2>
          {subtitle ? (
            <p className="mt-4 text-base text-mkt-navy/70 md:text-lg">{subtitle}</p>
          ) : null}
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
