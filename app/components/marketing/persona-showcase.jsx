"use client";

import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/app/lib/utils";

import { CrmMockup } from "./crm-mockup";
import { GridTexture } from "./grid-texture";
import { MarkerTag } from "./marker-tag";
import { MKT_EASE, Reveal, useMktMotion } from "./motion";

const TERRAIN_BG = {
  lime: "bg-[#eef8dc]",
  sky: "bg-[#e8f4fc]",
  sun: "bg-[#fef9e6]",
  pink: "bg-[#fce8f0]",
};

function PersonaMarker({ label, tone, className, delay = 0 }) {
  const { animate } = useMktMotion();
  const bg = {
    lime: "bg-mkt-lime",
    sun: "bg-mkt-sun",
    pink: "bg-mkt-pink",
    coral: "bg-mkt-coral",
    sky: "bg-mkt-sky",
  }[tone] || "bg-mkt-sun";

  const inner = (
    <>
      <span className="flex size-8 items-center justify-center rounded-full bg-white text-xs font-bold shadow-md ring-2 ring-mkt-navy/10">
        {label.charAt(0)}
      </span>
      <span className={cn("rounded-full px-2.5 py-1 text-[0.65rem] font-bold text-mkt-navy", bg)}>
        {label}
      </span>
    </>
  );

  if (!animate) {
    return <div className={cn("absolute flex items-center gap-2", className)}>{inner}</div>;
  }

  return (
    <motion.div
      className={cn("absolute flex items-center gap-2", className)}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
      transition={{
        opacity: { delay, duration: 0.5, ease: MKT_EASE },
        scale: { delay, duration: 0.5, ease: MKT_EASE },
        y: { delay: delay + 0.5, duration: 4, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      {inner}
    </motion.div>
  );
}

function PixelTerrain({ tone = "lime", className }) {
  const fills = {
    lime: "#c5f042",
    sky: "#4ec0e8",
    sun: "#ffe24a",
    pink: "#ff80ab",
  };
  const fill = fills[tone] || fills.lime;

  const blocks = [
    { x: 10, y: 40, w: 24, h: 16, o: 0.9 },
    { x: 34, y: 32, w: 20, h: 24, o: 0.7 },
    { x: 54, y: 28, w: 28, h: 20, o: 1 },
    { x: 82, y: 36, w: 18, h: 28, o: 0.6 },
    { x: 22, y: 56, w: 32, h: 12, o: 0.5 },
    { x: 60, y: 52, w: 36, h: 16, o: 0.8 },
  ];

  return (
    <svg viewBox="0 0 120 80" className={className} aria-hidden>
      {blocks.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill={fill} opacity={b.o} rx="1" />
      ))}
    </svg>
  );
}

function PersonaPanel({ current }) {
  const { animate } = useMktMotion();
  const terrain = current.terrain || "lime";
  const useCaseClass =
    "absolute bottom-8 left-4 z-20 max-w-[220px] rounded-xl border border-mkt-navy/8 bg-white p-4 text-left shadow-xl md:left-12";

  return (
    <>
      <h3 className="mb-6 font-mkt-display text-2xl text-mkt-navy md:text-3xl">{current.headline}</h3>

      <div className="relative mx-auto min-h-[360px] max-w-3xl overflow-visible sm:min-h-[440px]">
        <div
          className={cn(
            "absolute inset-x-2 top-12 bottom-20 overflow-hidden rounded-2xl sm:inset-x-4 md:inset-x-8",
            TERRAIN_BG[terrain] || TERRAIN_BG.lime,
          )}
        >
          <GridTexture tone={terrain === "pink" ? "pink" : terrain === "sky" ? "sky" : "lime"} className="opacity-40" />
          <PixelTerrain tone={terrain} className="absolute inset-0 h-full w-full object-cover opacity-80" />
        </div>

        {current.markers?.map((m, i) => (
          <PersonaMarker
            key={`${current.id}-${m.label}`}
            label={m.label}
            tone={m.tone}
            className={m.className}
            delay={0.15 + i * 0.08}
          />
        ))}

        <div className="relative z-10 flex justify-center pt-20 pb-4">
          <div className="w-full max-w-sm">
            <CrmMockup
              key={current.id}
              activeTab={current.activeTab ?? 1}
              data={current.mockup}
              skipEntrance
            />
          </div>
        </div>

        {current.useCase ? (
          animate ? (
            <motion.div
              key={`${current.id}-usecase`}
              className={useCaseClass}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.45, ease: MKT_EASE }}
            >
              {current.useCase.tag ? (
                <MarkerTag tone="coral" className="mb-2">
                  {current.useCase.tag}
                </MarkerTag>
              ) : null}
              <p className="text-sm font-bold text-mkt-navy">{current.useCase.title}</p>
              <p className="mt-1 text-xs text-mkt-navy/60">{current.useCase.description}</p>
            </motion.div>
          ) : (
            <div className={useCaseClass}>
              {current.useCase.tag ? (
                <MarkerTag tone="coral" className="mb-2">
                  {current.useCase.tag}
                </MarkerTag>
              ) : null}
              <p className="text-sm font-bold text-mkt-navy">{current.useCase.title}</p>
              <p className="mt-1 text-xs text-mkt-navy/60">{current.useCase.description}</p>
            </div>
          )
        ) : null}
      </div>

      <Link
        href={current.href}
        className="mt-6 inline-flex items-center gap-1 font-mono text-sm font-semibold text-mkt-navy/70 transition-all hover:gap-2 hover:text-mkt-navy"
      >
        {current.cta}
        <span aria-hidden>→</span>
      </Link>
    </>
  );
}

export function PersonaShowcase({ title, subtitle, personas }) {
  const [active, setActive] = useState(0);
  const { animate } = useMktMotion();
  const current = personas[active];

  const selectTab = useCallback(
    (index) => {
      setActive(index);
      const id = personas[index]?.id;
      if (id && typeof window !== "undefined") {
        window.history.replaceState(null, "", `#${id}`);
      }
    },
    [personas],
  );

  useEffect(() => {
    function syncFromHash() {
      const hash = window.location.hash.replace("#", "");
      const index = personas.findIndex((p) => p.id === hash);
      if (index >= 0) setActive(index);
    }
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [personas]);

  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-mkt-display text-3xl text-mkt-navy md:text-5xl">{title}</h2>
          <p className="mt-4 text-base text-mkt-navy/70 md:text-lg">{subtitle}</p>
        </Reveal>

        {/* Tab pills — z-30 so nothing overlaps click targets */}
        <LayoutGroup>
          <div
            role="tablist"
            aria-label="Roles"
            className="relative z-30 mt-10 flex flex-wrap justify-center gap-2"
          >
            {personas.map((p, i) => {
              const selected = i === active;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`persona-panel-${p.id}`}
                  onClick={() => selectTab(i)}
                  className={cn(
                    "relative rounded-full px-4 py-2.5 text-sm font-semibold transition-colors duration-300",
                    selected ? "text-mkt-navy" : "text-mkt-navy/60 hover:text-mkt-navy",
                  )}
                >
                  {selected && animate ? (
                    <motion.span
                      layoutId="persona-tab-bg"
                      className="absolute inset-0 rounded-full bg-mkt-lime shadow-md shadow-mkt-lime/30"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  ) : selected ? (
                    <span className="absolute inset-0 rounded-full bg-mkt-lime shadow-md shadow-mkt-lime/30" />
                  ) : null}
                  <span className="relative z-10">{p.label}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>

        {/* Visual panel — always use motion.div inside AnimatePresence (required for mode="wait") */}
        <div className="relative z-10 mx-auto mt-10 max-w-4xl">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.id}
              id={`persona-panel-${current.id}`}
              role="tabpanel"
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              exit={animate ? { opacity: 0, y: -12 } : undefined}
              transition={{ duration: animate ? 0.35 : 0.01, ease: MKT_EASE }}
              className="text-center"
            >
              <PersonaPanel current={current} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
