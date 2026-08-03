"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import { CrmMockup } from "./crm-mockup";
import { Reveal } from "./motion";
import { useMktMotion } from "./motion";

export function BeforeAfterShowcase({ title, subtitle }) {
  const [position, setPosition] = useState(50);
  const dragging = useRef(false);
  const trackRef = useRef(null);
  const demoRef = useRef(null);
  const { reduce } = useMktMotion();

  const updateFromClientX = useCallback((clientX) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    setPosition(pct);
  }, []);

  const stopDemo = useCallback(() => {
    if (demoRef.current) {
      cancelAnimationFrame(demoRef.current);
      demoRef.current = null;
    }
  }, []);

  const startDemo = useCallback(() => {
    if (reduce || dragging.current) return;
    stopDemo();

    const start = performance.now();
    const tick = (now) => {
      if (dragging.current) return;
      const t = (now - start) / 1000;
      const pct = 50 + Math.sin(t * 0.9) * 18;
      setPosition(pct);
      demoRef.current = requestAnimationFrame(tick);
    };
    demoRef.current = requestAnimationFrame(tick);
  }, [reduce, stopDemo]);

  useEffect(() => {
    const timer = window.setTimeout(startDemo, 1200);
    return () => {
      window.clearTimeout(timer);
      stopDemo();
    };
  }, [startDemo, stopDemo]);

  const onPointerDown = (e) => {
    dragging.current = true;
    stopDemo();
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromClientX(e.clientX);
  };

  const onPointerMove = (e) => {
    if (!dragging.current) return;
    e.preventDefault();
    updateFromClientX(e.clientX);
  };

  const onPointerEnd = () => {
    dragging.current = false;
    window.setTimeout(startDemo, 2500);
  };

  return (
    <section className="bg-[#eef0f5] py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className="font-mkt-display text-4xl text-mkt-navy md:text-6xl">{title}</h2>
          {subtitle ? (
            <p className="mt-4 text-lg text-mkt-navy/65 md:text-xl">{subtitle}</p>
          ) : null}
        </Reveal>

        <Reveal delay={0.1} className="relative mx-auto mt-14 max-w-4xl">
          <div
            ref={trackRef}
            className="relative aspect-[16/10] overflow-hidden rounded-[1.75rem] border border-mkt-navy/10 bg-white shadow-2xl shadow-mkt-navy/10 select-none"
            data-lenis-prevent
          >
            {/* Before — email chaos */}
            <div className="pointer-events-none absolute inset-0 bg-[#f5f5f3] p-6 md:p-10">
              <span className="rounded-full bg-mkt-navy/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-mkt-navy/60">
                Before
              </span>
              <div className="mt-4 space-y-3 font-mono text-xs leading-relaxed text-mkt-navy/50 md:text-sm">
                <p>Re: Re: CR #47 — still waiting on client sign-off…</p>
                <p>Fwd: Budget update — see attached spreadsheet v4 FINAL</p>
                <p>Re: Re: Re: Portal login not working for Northwind</p>
                <p className="animate-pulse text-mkt-coral/70">● 3 unread threads · 2 days overdue</p>
              </div>
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage:
                    "linear-gradient(#0a1550 1px, transparent 1px), linear-gradient(90deg, #0a1550 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />
            </div>

            {/* After — Meridian */}
            <div
              className="pointer-events-none absolute inset-0 overflow-hidden bg-white"
              style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
            >
              <div className="absolute inset-0 p-4 md:p-6">
                <span className="rounded-full bg-mkt-lime px-3 py-1 text-xs font-bold uppercase tracking-wider text-mkt-navy">
                  After
                </span>
                <div className="mt-3 origin-top scale-[0.85] md:scale-90">
                  <CrmMockup skipEntrance live />
                </div>
              </div>
            </div>

            {/* Drag handle (visual only) */}
            <div
              className="pointer-events-none absolute inset-y-0 z-10 w-1 bg-mkt-navy shadow-lg"
              style={{ left: `${position}%`, transform: "translateX(-50%)" }}
            >
              <div className="absolute left-1/2 top-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-mkt-navy bg-white shadow-lg">
                <span className="text-lg text-mkt-navy" aria-hidden>
                  ↔
                </span>
              </div>
            </div>

            {/* Full-surface drag layer — fixes swipe on touch and clipped layers */}
            <div
              className="absolute inset-0 z-20 cursor-ew-resize touch-none"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerEnd}
              onPointerCancel={onPointerEnd}
              onLostPointerCapture={onPointerEnd}
              aria-label="Drag to compare before and after"
              role="slider"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(position)}
            />
          </div>

          <motion.p
            className="mt-4 text-center text-sm text-mkt-navy/45"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            Drag to compare · Spreadsheets vs Meridian
          </motion.p>
        </Reveal>
      </div>
    </section>
  );
}
