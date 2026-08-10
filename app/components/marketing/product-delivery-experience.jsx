"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";

import { cn } from "@/app/lib/utils";

import { MKT_EASE, Reveal, StaggerGroup, useMktInView, useMktMotion } from "./motion";
import { ProductStackRiver } from "./product-stack-river";

export { ProductStackRiver };

function MondayScene() {
  const lines = [
    { cmd: true, text: '$ meridian company create "Studio Arc"' },
    { cmd: false, text: "→ SOW attached · 2 contacts imported" },
    { cmd: true, text: "$ meridian project init --template retainer-q2" },
    { cmd: false, text: "→ board seeded · 12 tasks · budget line open" },
    { cmd: true, text: "$ meridian portal invite sarah@studioarc.com" },
    { cmd: false, text: "✓ invite sent before kickoff call", success: true },
  ];

  return (
    <div className="font-mono text-[0.72rem] leading-relaxed">
      {lines.map((line, i) => (
        <motion.p
          key={line.text}
          initial={false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.12, duration: 0.45, ease: MKT_EASE }}
          className={cn(
            "mt-2 first:mt-0",
            line.success ? "text-mkt-lime font-semibold" : line.cmd ? "text-mkt-navy" : "text-mkt-navy/45",
          )}
        >
          {line.text}
        </motion.p>
      ))}
      <span className="mkt-product-cursor mt-2 inline-block h-4 w-0.5 bg-mkt-cta align-middle" aria-hidden />
    </div>
  );
}

function WednesdayScene() {
  const rows = [
    { t: "09:14", e: "CR #52 opened — homepage sections added" },
    { t: "09:31", e: "Impact: +8h · +$3,200 · timeline +3d" },
    { t: "11:02", e: "Internal approval · Priya K." },
    { t: "16:48", e: "Client signed in portal · budget unlocked" },
  ];

  return (
    <div className="space-y-0 border-l-2 border-mkt-coral/50 pl-6">
      {rows.map((row, i) => (
        <motion.div
          key={row.t}
          initial={false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 + i * 0.1, duration: 0.5, ease: MKT_EASE }}
          className="relative border-b border-mkt-navy/8 py-4 last:border-0"
        >
          <span className="absolute -left-[calc(1.5rem+5px)] top-5 size-2.5 rounded-full bg-mkt-coral" />
          <p className="font-mono text-[0.6rem] uppercase tracking-wider text-mkt-navy/40">{row.t}</p>
          <p className="mt-1 text-sm text-mkt-navy">{row.e}</p>
        </motion.div>
      ))}
    </div>
  );
}

function FridayScene() {
  return (
    <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
      <motion.div
        initial={false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: MKT_EASE }}
      >
        <p className="font-mkt-display text-6xl leading-none text-mkt-lime md:text-8xl">42</p>
        <p className="mt-2 text-sm uppercase tracking-[0.2em] text-white/50">Summit Co. health</p>
        <p className="mt-6 max-w-sm text-base text-white/75">
          Delayed project delivery and an open change request pulled the score down. Retention sequence enrolled automatically
          — leadership saw it on the at-risk view before the QBR.
        </p>
      </motion.div>
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.55, ease: MKT_EASE }}
        className="font-mono text-[0.68rem] text-white/55"
      >
        <p>at_risk.filter(threshold=50)</p>
        <p className="mt-2 text-mkt-coral">→ 1 account matched</p>
        <p className="mt-4">retention.enroll(summit_co)</p>
        <p className="mt-2 text-mkt-lime">→ sequence: renewal-prep-14d</p>
      </motion.div>
    </div>
  );
}

const WEEK_BANDS = [
  { bg: "bg-white text-mkt-navy", accent: "bg-mkt-lime" },
  { bg: "bg-mkt-block-lime/25 text-mkt-navy", accent: "bg-mkt-coral" },
  { bg: "bg-mkt-navy text-white", accent: "bg-mkt-cta" },
];

/** Full-bleed week chapters */
export function ProductWeekChapters({ title, subtitle, items }) {
  const [active, setActive] = useState(0);

  return (
    <section className="relative">
      <div className="border-b border-mkt-navy/10 bg-white px-4 py-16 md:px-6 md:py-20">
        <Reveal className="mx-auto max-w-6xl">
          <h2 className="font-mkt-display text-3xl text-mkt-navy md:text-5xl">{title}</h2>
          <p className="mt-4 max-w-2xl text-mkt-navy/65">{subtitle}</p>
          <div className="mt-10 -mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            <div className="flex min-w-max border-b border-mkt-navy/15">
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  "relative shrink-0 px-4 py-3 text-left text-xs font-semibold transition sm:text-sm md:px-8 md:text-base",
                  i === active ? "text-mkt-navy" : "text-mkt-navy/40 hover:text-mkt-navy/70",
                )}
              >
                {item.label}
                {i === active ? (
                  <motion.span
                    layoutId="product-week-tab"
                    className={cn("absolute inset-x-0 bottom-0 h-0.5", WEEK_BANDS[i].accent)}
                    transition={{ duration: 0.35, ease: MKT_EASE }}
                  />
                ) : null}
              </button>
            ))}
            </div>
          </div>
        </Reveal>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={items[active].id}
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: MKT_EASE }}
          className={cn("min-h-[420px] md:min-h-[480px]", WEEK_BANDS[active].bg)}
        >
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 md:grid-cols-[1fr_1.1fr] md:px-6 md:py-24">
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] opacity-50">
                Chapter {active + 1}
              </p>
              <h3 className="mt-4 font-mkt-display text-3xl md:text-4xl">{items[active].headline}</h3>
              <p className="mt-5 text-base leading-relaxed opacity-75">{items[active].story}</p>
              <ul className="mt-8 space-y-3 border-t border-current/10 pt-8">
                {items[active].beats.map((b) => (
                  <li key={b} className="flex gap-3 text-sm opacity-80">
                    <span className="font-mono text-mkt-cta">—</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center">
              {active === 0 && <MondayScene key="mon" />}
              {active === 1 && <WednesdayScene key="wed" />}
              {active === 2 && <FridayScene key="fri" />}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

const BAND_STYLE = {
  companies: "bg-mkt-block-lime/45 text-mkt-navy",
  projects: "bg-mkt-block-sky/35 text-mkt-navy",
  "change-requests": "bg-mkt-block-coral/30 text-mkt-navy",
  portal: "bg-mkt-block-sun/40 text-mkt-navy",
  retention: "bg-mkt-navy text-white",
};

const ACCENT = {
  companies: "text-mkt-lime",
  projects: "text-mkt-sky",
  "change-requests": "text-mkt-coral",
  portal: "text-mkt-sun",
  retention: "text-mkt-pink",
};

function ViewCell({ label, children, delay = 0, play }) {
  return (
    <div className="bg-white/70 px-2 py-5 text-center md:px-3 md:py-8">
      <p className="font-bold opacity-50">{label}</p>
      <motion.div
        className="mx-auto mt-3 flex h-14 w-full max-w-[4.5rem] items-center justify-center md:h-16 md:max-w-[5rem]"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={play ? { opacity: 1, scale: 1 } : { opacity: 0.7, scale: 1 }}
        transition={{ delay, duration: 0.5, ease: MKT_EASE }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function BoardMiniAnim({ play }) {
  const cols = [
    [{ h: "h-2.5" }, { h: "h-2" }],
    [{ h: "h-2" }, { h: "h-2.5" }],
    [{ h: "h-2.5" }],
  ];

  return (
    <div className="relative flex h-full w-full gap-1 px-0.5">
      {cols.map((cards, ci) => (
        <div key={ci} className="flex flex-1 flex-col gap-1 rounded-sm bg-mkt-navy/[0.04] p-1">
          {cards.map((card, ri) => (
            <motion.div
              key={`${ci}-${ri}`}
              className={cn("rounded-[3px] bg-mkt-sky/55", card.h)}
              initial={{ opacity: 0, y: 6 }}
              animate={play ? { opacity: 1, y: 0 } : { opacity: 0.5, y: 0 }}
              transition={{ delay: 0.15 + ci * 0.1 + ri * 0.08, duration: 0.45, ease: MKT_EASE }}
            />
          ))}
        </div>
      ))}
      {play ? (
        <motion.span
          className="mkt-view-board-card absolute left-[18%] top-[28%] h-2 w-[22%] rounded-[3px] bg-mkt-lime/80 shadow-sm"
          aria-hidden
        />
      ) : null}
    </div>
  );
}

function ListMiniAnim({ play }) {
  const rows = [
    { checked: true, wide: "w-full" },
    { checked: true, wide: "w-4/5" },
    { checked: false, wide: "w-full" },
    { checked: false, wide: "w-3/5" },
  ];

  return (
    <div className="flex h-full w-full flex-col justify-center gap-1.5 px-0.5">
      {rows.map((row, i) => (
        <motion.div
          key={i}
          className="flex items-center gap-1.5"
          initial={{ opacity: 0, x: -8 }}
          animate={play ? { opacity: 1, x: 0 } : { opacity: 0.55, x: 0 }}
          transition={{ delay: 0.12 + i * 0.09, duration: 0.4, ease: MKT_EASE }}
        >
          <span
            className={cn(
              "flex size-2.5 shrink-0 items-center justify-center rounded-[2px] border border-mkt-navy/20",
              row.checked && play && "border-mkt-lime bg-mkt-lime/25",
            )}
          >
            {row.checked && play ? (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.35 + i * 0.1, duration: 0.25, ease: MKT_EASE }}
                className="text-[6px] font-bold leading-none text-mkt-navy"
              >
                ✓
              </motion.span>
            ) : null}
          </span>
          <span className={cn("block h-1 rounded-full bg-mkt-sky/45", row.wide)} />
        </motion.div>
      ))}
    </div>
  );
}

function GanttMiniAnim({ play }) {
  const bars = [
    { y: 0, w: "85%", delay: 0.2 },
    { y: 1, w: "55%", delay: 0.35 },
    { y: 2, w: "70%", delay: 0.5 },
  ];

  return (
    <div className="relative flex h-full w-full flex-col justify-center gap-2 px-0.5">
      <div className="absolute inset-x-1 top-1 flex justify-between font-mono text-[5px] uppercase tracking-wider text-mkt-navy/25">
        <span>W1</span>
        <span>W2</span>
        <span>W3</span>
      </div>
      {bars.map((bar) => (
        <div key={bar.y} className="relative h-2.5 rounded-sm bg-mkt-navy/[0.05]">
          <motion.div
            className={cn(
              "absolute inset-y-0 left-0 rounded-sm bg-gradient-to-r from-mkt-sky/70 to-mkt-sky/40",
              play && "mkt-view-gantt-shimmer",
            )}
            initial={{ width: 0 }}
            animate={play ? { width: bar.w } : { width: bar.w }}
            transition={{ delay: bar.delay, duration: 0.7, ease: MKT_EASE }}
          />
        </div>
      ))}
    </div>
  );
}

function CalMiniAnim({ play }) {
  const days = Array.from({ length: 12 }, (_, i) => i);
  const today = 7;

  return (
    <div className="grid h-full w-full grid-cols-4 gap-1 px-0.5 content-center">
      {days.map((d) => (
        <motion.span
          key={d}
          className={cn(
            "aspect-square rounded-[2px]",
            d === today
              ? "bg-mkt-sky/65 ring-1 ring-mkt-sky/40"
              : d % 5 === 0
                ? "bg-mkt-coral/35"
                : "bg-mkt-navy/[0.07]",
            d === today && play && "mkt-view-cal-today",
          )}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={play ? { opacity: 1, scale: 1 } : { opacity: 0.5, scale: 1 }}
          transition={{ delay: 0.08 + d * 0.04, duration: 0.35, ease: MKT_EASE }}
        />
      ))}
    </div>
  );
}

function ProjectsViewShowcase({ animate }) {
  const reduce = useReducedMotion();
  const play = animate && !reduce;

  return (
    <div className="grid grid-cols-4 gap-px bg-mkt-navy/15 font-mono text-[0.6rem] uppercase md:text-[0.65rem]">
      <ViewCell label="Board" delay={0} play={play}>
        <BoardMiniAnim play={play} />
      </ViewCell>
      <ViewCell label="List" delay={0.08} play={play}>
        <ListMiniAnim play={play} />
      </ViewCell>
      <ViewCell label="Gantt" delay={0.16} play={play}>
        <GanttMiniAnim play={play} />
      </ViewCell>
      <ViewCell label="Cal" delay={0.24} play={play}>
        <CalMiniAnim play={play} />
      </ViewCell>
    </div>
  );
}

function ModuleVisual({ id, animate }) {
  if (id === "companies") {
    return (
      <pre className="overflow-x-auto font-mono text-[0.65rem] leading-loose opacity-90 md:text-xs">
{`Northwind Studio
├── contacts (3)
├── touchpoints (12)
├── contracts (2)
└── health: 88 ↑`}
      </pre>
    );
  }
  if (id === "projects") {
    return <ProjectsViewShowcase animate={animate} />;
  }
  if (id === "change-requests") {
    return (
      <div className="font-mono text-[0.7rem] md:text-xs">
        {["draft", "impact", "internal", "client", "live"].map((s, i) => (
          <div key={s} className="flex items-center gap-4 border-b border-mkt-navy/10 py-3">
            <span className="w-6 text-right opacity-40">{i + 1}</span>
            <span className={cn("uppercase", i < 3 && "text-mkt-coral font-semibold")}>{s}</span>
            {i < 3 ? <span className="ml-auto text-[0.65rem] text-mkt-lime">done</span> : null}
          </div>
        ))}
      </div>
    );
  }
  if (id === "portal") {
    return (
      <div className="font-mono text-sm">
        <p className="opacity-50">client_view only</p>
        <p className="mt-6 text-2xl font-bold md:text-3xl">Approve milestone?</p>
        <p className="mt-8 inline-block border-b-2 border-mkt-cta pb-1 text-xs font-bold uppercase tracking-[0.2em] text-mkt-cta">
          Confirm signature
        </p>
        <p className="mt-8 text-[0.65rem] opacity-40">internal boards · budgets · notes hidden</p>
      </div>
    );
  }
  return (
    <div className="flex items-baseline gap-6">
      <p className={cn("font-mkt-display text-7xl md:text-8xl", ACCENT.retention)}>82</p>
      <div className="font-mono text-[0.65rem] opacity-70 md:text-xs">
        <p>weights.configured</p>
        <p className="mt-2">at_risk.dashboard()</p>
        <p className="mt-2">sequences.trigger()</p>
      </div>
    </div>
  );
}

function ModuleBand({ mod, index }) {
  const ref = useRef(null);
  const inView = useMktInView(ref);

  return (
    <article
      ref={ref}
      id={mod.id}
      className={cn(
        "relative scroll-mt-24 overflow-hidden border-b border-mkt-navy/5",
        BAND_STYLE[mod.id] || BAND_STYLE.projects,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-4 top-4 select-none font-mkt-display text-[clamp(5rem,18vw,14rem)] leading-none opacity-[0.08]"
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -left-20 top-1/2 size-64 -translate-y-1/2 rounded-full blur-[100px] opacity-30",
          mod.id === "companies" && "bg-mkt-lime/35",
          mod.id === "projects" && "bg-mkt-sky/35",
          mod.id === "change-requests" && "bg-mkt-coral/35",
          mod.id === "portal" && "bg-mkt-sun/40",
          mod.id === "retention" && "bg-mkt-pink/40",
        )}
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:gap-16 md:px-6 md:py-24">
        <Reveal x={-24}>
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.25em] opacity-50">
            Layer {index + 1}
          </p>
          <h3 className="mt-3 font-mkt-display text-3xl md:text-4xl lg:text-5xl">{mod.title}</h3>
          <p className="mt-5 max-w-md text-base leading-relaxed opacity-75">{mod.body}</p>
          <ul className="mt-6 space-y-2">
            {mod.bullets?.map((b) => (
              <li key={b} className="text-sm opacity-70">
                <span className={cn("mr-2", ACCENT[mod.id])}>▸</span>
                {b}
              </li>
            ))}
          </ul>
          {(mod.id === "change-requests" || mod.id === "retention") && (
            <Link
              href={`/blog/${mod.id === "change-requests" ? "reduce-change-request-chaos" : "client-health-scores-explained"}`}
              className="mt-6 inline-block font-mono text-xs uppercase tracking-wider text-mkt-cta underline underline-offset-4 hover:text-mkt-cta-hover"
            >
              Read guide →
            </Link>
          )}
        </Reveal>
        <Reveal delay={0.12} x={24}>
          <ModuleVisual id={mod.id} animate={inView} />
        </Reveal>
      </div>
    </article>
  );
}

/** Full-bleed module bands */
export function ProductModuleBands({ title, subtitle, modules }) {
  return (
    <section>
      <div className="border-b border-mkt-navy/10 bg-white px-4 py-16 md:px-6 md:py-20">
        <Reveal className="mx-auto max-w-6xl">
          <h2 className="font-mkt-display text-3xl text-mkt-navy md:text-5xl">{title}</h2>
          <p className="mt-4 max-w-2xl text-mkt-navy/65">{subtitle}</p>
        </Reveal>
      </div>

      {modules.map((mod, i) => (
        <ModuleBand key={mod.id} mod={mod} index={i} />
      ))}
    </section>
  );
}

/** Typographic proof strip */
export function ProductProofLine({ title, items }) {
  return (
    <section className="border-y border-mkt-navy/10 bg-[#f7f8fc] py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <Reveal>
          <p className="text-center font-mono text-[0.65rem] uppercase tracking-[0.3em] text-mkt-navy/40">
            {title}
          </p>
        </Reveal>
        <StaggerGroup
          className="mt-8 flex flex-col items-center justify-center gap-6 md:flex-row md:gap-0 md:divide-x md:divide-mkt-navy/15"
          stagger={0.1}
        >
          {items.map((item) => (
            <motion.div
              key={item.label}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: MKT_EASE } },
              }}
              className="px-8 text-center md:px-12"
            >
              <p className="font-mkt-display text-4xl text-mkt-cta md:text-5xl">{item.stat}</p>
              <p className="mt-2 text-sm font-semibold text-mkt-navy">{item.label}</p>
              <p className="mt-1 max-w-[200px] text-xs text-mkt-navy/50">{item.detail}</p>
            </motion.div>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
