"use client";

import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useState } from "react";

import { cn } from "@/app/lib/utils";

import { MarkerTag } from "./marker-tag";
import { MKT_EASE, Reveal } from "./motion";
import { WhyMeridianVisualPanel } from "./why-meridian-visuals";

export function WhyMeridianSection({ title, subtitle, items, badge }) {
  const [active, setActive] = useState(0);

  return (
    <section className="relative overflow-hidden bg-[#f8f8f6] py-20 md:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(10,21,80,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(10,21,80,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Reveal>
              {badge ? <MarkerTag tone="sun">{badge}</MarkerTag> : null}
              <h2 className="mt-4 font-mkt-display text-3xl text-mkt-navy md:text-4xl lg:text-5xl">
                {title}
              </h2>
              <p className="mt-4 max-w-lg text-base text-mkt-navy/70">{subtitle}</p>
            </Reveal>

            <LayoutGroup>
              <div className="mt-10 divide-y divide-mkt-navy/10 border-y border-mkt-navy/10">
                {items.map((item, i) => {
                  const isOpen = i === active;
                  return (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => setActive(i)}
                      className={cn(
                        "relative w-full px-0 py-5 text-left transition-colors duration-300",
                        isOpen && "-mx-4 rounded-xl px-4 md:-mx-6 md:px-6",
                      )}
                    >
                      {isOpen ? (
                        <motion.span
                          layoutId="why-meridian-highlight"
                          className="absolute inset-0 rounded-xl bg-mkt-sky/15"
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        />
                      ) : null}
                      <span className="relative z-10 block">
                        <h3 className="font-mkt-display text-lg text-mkt-navy md:text-xl">
                          {item.title}
                        </h3>
                        <AnimatePresence initial={false}>
                          {isOpen ? (
                            <motion.div
                              key="content"
                              initial={false}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: MKT_EASE }}
                              className="overflow-hidden"
                            >
                              <p className="mt-3 text-sm leading-relaxed text-mkt-navy/70">
                                {item.description}
                              </p>
                              {item.href ? (
                                <Link
                                  href={item.href}
                                  className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-mkt-navy hover:gap-2"
                                >
                                  {item.linkLabel || "Explore"}
                                  <span aria-hidden>→</span>
                                </Link>
                              ) : null}
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </span>
                    </button>
                  );
                })}
              </div>
            </LayoutGroup>
          </div>

          <Reveal delay={0.15} x={48} y={0} className="relative lg:sticky lg:top-24">
            <div className="relative mx-auto min-h-[420px] max-w-md lg:max-w-none">
              <AnimatePresence mode="wait" initial={false}>
                <WhyMeridianVisualPanel key={active} activeIndex={active} />
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
