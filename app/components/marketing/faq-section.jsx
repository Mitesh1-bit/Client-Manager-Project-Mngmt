"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { Reveal } from "./motion";
import { MKT_EASE } from "./motion";

export function FaqSection({ title, subtitle, items }) {
  const [open, setOpen] = useState(0);

  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <h2 className="font-mkt-display text-4xl text-mkt-navy md:text-6xl">{title}</h2>
          {subtitle ? <p className="mt-4 text-lg text-mkt-navy/65">{subtitle}</p> : null}
        </Reveal>

        <ul className="mt-12 divide-y divide-mkt-navy/10 border-y border-mkt-navy/10">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <li key={item.question}>
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-4 py-5 text-left"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                >
                  <span className="font-mkt-display text-lg text-mkt-navy md:text-xl">
                    {item.question}
                  </span>
                  <motion.span
                    className="mt-1 shrink-0 text-xl text-mkt-navy/40"
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.25, ease: MKT_EASE }}
                    aria-hidden
                  >
                    +
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: MKT_EASE }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 text-base leading-relaxed text-mkt-navy/70">{item.answer}</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function PlayLearnSection({ title, subtitle, ctaHref, ctaLabel }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
      <Reveal>
        <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#0a1550] via-[#0f2060] to-[#1e3a8a] px-6 py-16 text-center text-white shadow-2xl shadow-mkt-navy/20 md:px-12 md:py-24">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-[#2563eb]/30 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-20 size-80 rounded-full bg-[#38bdf8]/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative mx-auto max-w-3xl">
            <h2 className="font-mkt-display text-4xl md:text-6xl lg:text-7xl">{title}</h2>
            {subtitle ? (
              <p className="mx-auto mt-5 max-w-xl text-lg text-white/80 md:text-xl">{subtitle}</p>
            ) : null}
            {ctaHref ? (
              <a
                href={ctaHref}
                className="mt-10 inline-flex items-center justify-center rounded-full bg-white px-8 py-3.5 text-sm font-bold text-mkt-navy shadow-lg transition hover:bg-[#38bdf8]/25 hover:text-white"
              >
                {ctaLabel}
              </a>
            ) : null}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
