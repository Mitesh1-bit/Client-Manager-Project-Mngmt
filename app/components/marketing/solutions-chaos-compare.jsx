"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/app/lib/utils";

import { MKT_EASE, Reveal, useMktInView } from "./motion";

const MANUAL_LINES = [
  "Re: CR #47 — can you confirm scope?",
  "Re: Re: waiting on client…",
  "Fwd: still no sign-off",
  "Re: Re: Re: legal reviewing?",
];

export function SolutionsChaosCompare({ title, subtitle, manualLabel, meridianLabel }) {
  const ref = useRef(null);
  const inView = useMktInView(ref, { amount: 0.3 });
  const reduce = useReducedMotion();
  const play = inView && !reduce;
  const [manualWpm] = useState(12);
  const [flowWpm, setFlowWpm] = useState(0);

  useEffect(() => {
    if (!play) return undefined;
    let v = 0;
    const id = setInterval(() => {
      v = v >= 58 ? 0 : v + 2;
      setFlowWpm(v);
    }, 60);
    return () => clearInterval(id);
  }, [play]);

  return (
    <section ref={ref} className="border-y border-mkt-navy/8 bg-[#faf9f6] py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-mkt-display text-4xl text-mkt-navy sm:text-5xl md:text-7xl">
            3× <span className="text-mkt-coral">faster</span>
          </p>
          <h2 className="mt-4 font-mkt-display text-2xl text-mkt-navy md:text-4xl">{title}</h2>
          <p className="mt-3 text-base text-mkt-navy/60 md:text-lg">{subtitle}</p>
        </Reveal>

        <div className="mt-14 grid gap-8 lg:grid-cols-2 lg:gap-10">
          <ComparePanel
            label={manualLabel}
            headline="Email threads"
            wpm={manualWpm}
            wpmLabel="approvals / week"
            tone="manual"
            play={play}
          >
            <div className="space-y-2 font-mono text-[0.72rem] leading-relaxed text-mkt-navy/40">
              {MANUAL_LINES.map((line, i) => (
                <motion.p
                  key={line}
                  animate={play ? { opacity: [0.35, 0.7, 0.35] } : {}}
                  transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }}
                >
                  {line}
                </motion.p>
              ))}
            </div>
          </ComparePanel>

          <ComparePanel
            label={meridianLabel}
            headline="One portal"
            wpm={flowWpm || 58}
            wpmLabel="approvals / week"
            tone="meridian"
            play={play}
          >
            <div className="space-y-2">
              {["CR submitted", "Client notified", "Approved & logged"].map((step, i) => (
                <motion.div
                  key={step}
                  className="flex items-center justify-between rounded-lg bg-mkt-lime/35 px-3 py-2.5 text-sm font-semibold text-mkt-navy"
                  initial={{ opacity: 0.4 }}
                  animate={play && flowWpm > i * 18 ? { opacity: 1, x: 0 } : { opacity: 0.45 }}
                  transition={{ duration: 0.3 }}
                >
                  {step}
                  <span className="rounded-full bg-mkt-navy px-2 py-0.5 text-[0.6rem] text-white">✓</span>
                </motion.div>
              ))}
            </div>
          </ComparePanel>
        </div>

        <Reveal className="mt-10 text-center">
          <Link
            href="/product#change-requests"
            className="inline-flex items-center gap-2 font-semibold text-mkt-navy transition hover:gap-3"
          >
            See the change request module
            <span aria-hidden>→</span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

function ComparePanel({ label, headline, wpm, wpmLabel, tone, play, children }) {
  const isManual = tone === "manual";

  return (
    <motion.div
      className={cn(
        "relative rounded-[1.35rem] border p-5 md:p-6",
        isManual ? "border-mkt-navy/10 bg-white/60" : "border-mkt-lime/40 bg-white shadow-lg shadow-mkt-lime/10",
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, ease: MKT_EASE }}
    >
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-mkt-navy/45">{label}</p>
      <p className="mt-2 font-mkt-display text-2xl text-mkt-navy md:text-3xl">{headline}</p>

      <div className="mt-4 flex items-baseline gap-2">
        <motion.span
          className={cn("font-mkt-display text-4xl", isManual ? "text-mkt-navy/25" : "text-mkt-coral")}
          key={wpm}
        >
          {wpm}
        </motion.span>
        <span className="text-xs font-semibold uppercase tracking-wider text-mkt-navy/40">{wpmLabel}</span>
      </div>

      <div className="mt-4 min-h-[96px]">{children}</div>

      {!isManual && play ? (
        <motion.div
          className="pointer-events-none absolute -right-2 bottom-4 font-mkt-display text-6xl text-mkt-lime/30"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          3×
        </motion.div>
      ) : null}
    </motion.div>
  );
}
