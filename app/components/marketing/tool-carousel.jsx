"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, forwardRef } from "react";

import { cn } from "@/app/lib/utils";

import { Reveal } from "./motion";
import { ToolCardIllustration } from "./tool-card-illustrations";

const CARD_BG = {
  lime: "from-mkt-lime via-[#d4f55a] to-[#a8e020]",
  sky: "from-mkt-sky via-[#7dd3fc] to-[#38bdf8]",
  coral: "from-mkt-coral via-[#ff8a7a] to-[#ff6b5b]",
  sun: "from-mkt-sun via-[#fff176] to-[#ffe24a]",
  pink: "from-mkt-pink via-[#ff80ab] to-[#ff4d8d]",
};

const AUTO_SCROLL_PX = 0.9;
const PAUSE_AFTER_MANUAL_MS = 2200;

function ToolCard({ tool, className }) {
  const gradient = CARD_BG[tool.tone] || CARD_BG.lime;

  return (
    <Link
      href={`/product#${tool.id}`}
      className={cn(
        "group relative block shrink-0",
        "h-[min(72vw,300px)] w-[min(76vw,240px)]",
        "sm:h-[320px] sm:w-[252px]",
        "md:h-[360px] md:w-[280px]",
        "lg:h-[400px] lg:w-[300px]",
        className,
      )}
    >
      <div
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-[1.5rem] bg-gradient-to-br p-5 shadow-lg transition-transform duration-500 group-hover:scale-[1.02] group-hover:shadow-2xl sm:rounded-[1.75rem] sm:p-6",
          gradient,
        )}
      >
        <ToolCardIllustration toolId={tool.id} />

        <div className="relative z-10 mt-auto flex min-h-0 flex-col justify-end pt-3">
          <p className="font-mkt-display text-xl leading-tight text-mkt-navy transition-transform duration-300 group-hover:translate-x-1 sm:text-2xl md:text-[1.65rem]">
            {tool.title}
          </p>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-mkt-navy/75 sm:line-clamp-3">
            {tool.body}
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-mkt-navy/60 transition-all group-hover:gap-2 group-hover:text-mkt-navy sm:mt-4">
            Explore
            <span aria-hidden>→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

const ToolCardRow = forwardRef(function ToolCardRow({ tools, className, rowKey = "a", ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn("flex shrink-0 gap-4 px-2 md:gap-6 md:px-4", className)}
      {...props}
    >
      {tools.map((tool) => (
        <ToolCard key={`${rowKey}-${tool.id}`} tool={tool} />
      ))}
    </div>
  );
});

export function ToolCarousel({ tools, title, subtitle, ctaHref, ctaLabel }) {
  const trackRef = useRef(null);
  const rowRef = useRef(null);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const frameRef = useRef(null);
  const pauseTimerRef = useRef(null);
  const halfWidthRef = useRef(0);

  const pause = useCallback((temporary = false) => {
    pausedRef.current = true;
    if (temporary) {
      if (pauseTimerRef.current) window.clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = window.setTimeout(() => {
        pausedRef.current = false;
        pauseTimerRef.current = null;
      }, PAUSE_AFTER_MANUAL_MS);
    }
  }, []);

  const measure = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    halfWidthRef.current = row.offsetWidth;
  }, []);

  const applyTransform = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
  }, []);

  const normalizeOffset = useCallback(() => {
    const half = halfWidthRef.current;
    if (half <= 0) return;
    while (offsetRef.current <= -half) offsetRef.current += half;
    while (offsetRef.current > 0) offsetRef.current -= half;
  }, []);

  const getCardStep = useCallback(() => {
    const row = rowRef.current;
    if (!row?.firstElementChild) return 304;
    const card = row.firstElementChild;
    const styles = window.getComputedStyle(row);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "20") || 20;
    return card.getBoundingClientRect().width + gap;
  }, []);

  const nudge = useCallback(
    (direction) => {
      measure();
      offsetRef.current += direction * getCardStep();
      normalizeOffset();
      applyTransform();
      pause(true);
    },
    [applyTransform, getCardStep, measure, normalizeOffset, pause],
  );

  const tick = useCallback(() => {
    if (!pausedRef.current && halfWidthRef.current > 0) {
      offsetRef.current -= AUTO_SCROLL_PX;
      normalizeOffset();
      applyTransform();
    }
    frameRef.current = requestAnimationFrame(tick);
  }, [applyTransform, normalizeOffset]);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return undefined;

    const sync = () => {
      measure();
      normalizeOffset();
      applyTransform();
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(row);

    frameRef.current = requestAnimationFrame(tick);

    const onTouchStart = () => pause(true);
    row.addEventListener("touchstart", onTouchStart, { passive: true });

    return () => {
      observer.disconnect();
      row.removeEventListener("touchstart", onTouchStart);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (pauseTimerRef.current) window.clearTimeout(pauseTimerRef.current);
    };
  }, [applyTransform, measure, normalizeOffset, pause, tick]);

  return (
    <section className="overflow-hidden bg-white py-14 sm:py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className="font-mkt-display text-[clamp(2rem,7vw,4.5rem)] leading-[1.05] text-balance text-mkt-navy md:text-6xl lg:text-7xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="mx-auto mt-4 max-w-xl text-base text-pretty text-mkt-navy/65 sm:text-lg md:text-xl">
              {subtitle}
            </p>
          ) : null}
          {ctaHref ? (
            <Link href={ctaHref} className="mkt-btn-primary mt-6 inline-flex sm:mt-8">
              {ctaLabel || "Get started"}
            </Link>
          ) : null}
        </Reveal>
      </div>

      <div className="relative mt-10 md:mt-14">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white to-transparent sm:w-16 md:w-20 lg:w-28" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white to-transparent sm:w-16 md:w-20 lg:w-28" />

        {/* Side arrows — desktop / tablet */}
        <button
          type="button"
          onClick={() => nudge(1)}
          className="absolute left-2 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-mkt-navy/15 bg-white text-mkt-navy shadow-lg transition hover:border-mkt-navy/30 hover:bg-mkt-navy hover:text-white sm:left-3 sm:flex sm:size-11 md:left-6 md:size-12"
          aria-label="Previous slide"
        >
          <ChevronLeft className="size-5" strokeWidth={2.5} />
        </button>

        <button
          type="button"
          onClick={() => nudge(-1)}
          className="absolute right-2 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-mkt-navy/15 bg-white text-mkt-navy shadow-lg transition hover:border-mkt-navy/30 hover:bg-mkt-navy hover:text-white sm:right-3 sm:flex sm:size-11 md:right-6 md:size-12"
          aria-label="Next slide"
        >
          <ChevronRight className="size-5" strokeWidth={2.5} />
        </button>

        <div className="overflow-hidden" data-lenis-prevent>
          <div
            ref={trackRef}
            className="flex w-max will-change-transform"
            style={{ transform: "translate3d(0, 0, 0)" }}
          >
            <ToolCardRow ref={rowRef} tools={tools} rowKey="a" />
            <ToolCardRow tools={tools} rowKey="b" aria-hidden />
          </div>
        </div>

        {/* Bottom arrows — mobile */}
        <div className="mt-5 flex items-center justify-center gap-3 px-4 sm:hidden">
          <button
            type="button"
            onClick={() => nudge(1)}
            className="flex size-10 items-center justify-center rounded-full border border-mkt-navy/15 bg-white text-mkt-navy shadow-md transition hover:border-mkt-navy/30 hover:bg-mkt-navy hover:text-white"
            aria-label="Previous module"
          >
            <ChevronLeft className="size-5" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => nudge(-1)}
            className="flex size-10 items-center justify-center rounded-full border border-mkt-navy/15 bg-white text-mkt-navy shadow-md transition hover:border-mkt-navy/30 hover:bg-mkt-navy hover:text-white"
            aria-label="Next module"
          >
            <ChevronRight className="size-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </section>
  );
}
