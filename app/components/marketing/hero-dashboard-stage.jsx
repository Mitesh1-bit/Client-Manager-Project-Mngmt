"use client";

import { motion } from "framer-motion";

import { cn } from "@/app/lib/utils";

import { useMktMotion } from "./motion";
import { MktScaleViewport } from "./mkt-scale-viewport";

const ACTIVITY = [
  { time: "Just now", text: "Northwind approved homepage refresh", tone: "lime" },
  { time: "2m ago", text: "CR #47 entered client review", tone: "sky" },
  { time: "8m ago", text: "Health score ↑ 82 → 88", tone: "sun" },
  { time: "14m ago", text: "Portal comment on checkout flow", tone: "coral" },
];

const PROJECTS = [
  { name: "Homepage hero refresh", status: "In review", pct: 78 },
  { name: "Checkout flow update", status: "Approved", pct: 100 },
  { name: "Brand guidelines v2", status: "Draft", pct: 42 },
];

const KPIS = [
  { label: "Active projects", value: "24", tone: "from-mkt-lime/90 to-mkt-lime/50" },
  { label: "Pending approvals", value: "7", tone: "from-mkt-sky/90 to-mkt-sky/50" },
  { label: "At-risk accounts", value: "3", tone: "from-mkt-sun/90 to-mkt-sun/50" },
];

function toneDot(tone) {
  return cn(
    "mt-1 size-1.5 shrink-0 rounded-full",
    tone === "lime" && "bg-mkt-lime",
    tone === "sky" && "bg-mkt-sky",
    tone === "sun" && "bg-mkt-sun",
    tone === "coral" && "bg-mkt-coral",
  );
}

function ActivityFeed({ loop }) {
  const items = [...ACTIVITY, ...ACTIVITY];

  return (
    <div className="overflow-hidden rounded-xl border border-mkt-navy/8 bg-white/95 p-3 shadow-lg backdrop-blur-sm">
      <p className="mb-2 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-mkt-navy/45">
        Live activity
      </p>
      <div className="relative h-[100px] overflow-hidden">
        {loop ? (
          <motion.div
            className="space-y-2"
            animate={{ y: [0, -((ACTIVITY.length * 34) / 2)] }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          >
            {items.map((item, i) => (
              <div key={`${item.text}-${i}`} className="flex items-start gap-2 text-[0.62rem]">
                <span className={toneDot(item.tone)} />
                <div className="min-w-0">
                  <p className="font-medium leading-snug text-mkt-navy">{item.text}</p>
                  <p className="text-mkt-navy/40">{item.time}</p>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <div className="space-y-2">
            {ACTIVITY.slice(0, 3).map((item) => (
              <div key={item.text} className="flex items-start gap-2 text-[0.62rem]">
                <span className={toneDot(item.tone)} />
                <div className="min-w-0">
                  <p className="font-medium leading-snug text-mkt-navy">{item.text}</p>
                  <p className="text-mkt-navy/40">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MainDashboard({ loop, ready }) {
  return (
    <div className="relative overflow-hidden rounded-[1.35rem] border border-white/80 bg-white/95 shadow-[0_32px_64px_-20px_rgba(10,21,80,0.24)] backdrop-blur-xl ring-1 ring-mkt-navy/5">
      <div className="flex items-center gap-2 border-b border-mkt-navy/8 bg-gradient-to-r from-mkt-navy/[0.04] to-transparent px-4 py-3">
        <span className="size-2.5 rounded-full bg-mkt-coral" />
        <span className="size-2.5 rounded-full bg-mkt-sun" />
        <span className="size-2.5 rounded-full bg-mkt-lime" />
        <span className="ml-1 truncate text-xs font-semibold text-mkt-navy/70">
          Meridian · Delivery command
        </span>
        <span className="ml-auto flex items-center gap-1.5 rounded-full bg-mkt-lime/30 px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-mkt-navy">
          <span className="size-1.5 animate-pulse rounded-full bg-mkt-lime" />
          Live
        </span>
      </div>

      <div className="flex items-center justify-center gap-3 border-b border-mkt-navy/8 px-4 py-4 sm:gap-4">
        {KPIS.map((kpi, i) => (
          <div
            key={kpi.label}
            className={cn(
              "mkt-hero-kpi flex shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br p-2 text-center",
              ready && "mkt-hero-kpi--in",
              kpi.tone,
            )}
            style={ready ? { animationDelay: `${150 + i * 80}ms` } : undefined}
          >
            <p className="font-mkt-display text-xl leading-none text-mkt-navy sm:text-2xl">{kpi.value}</p>
            <p className="mt-1 max-w-[4.25rem] text-[0.45rem] font-semibold uppercase leading-tight tracking-wide text-mkt-navy/55 sm:text-[0.48rem]">
              {kpi.label}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-2 p-4 pb-5">
        <div className="flex items-center justify-between">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-mkt-navy/45">Pipeline</p>
          <span className="text-[0.6rem] font-medium text-mkt-navy/40">This week</span>
        </div>

        {PROJECTS.map((row, i) => (
          <div
            key={row.name}
            className={cn(
              "mkt-hero-row rounded-lg border border-mkt-navy/8 bg-mkt-navy/[0.02] p-2.5",
              ready && "mkt-hero-row--in",
            )}
            style={ready ? { animationDelay: `${280 + i * 100}ms` } : undefined}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[0.72rem] font-semibold text-mkt-navy">{row.name}</p>
              <span
                className={cn(
                  "shrink-0 rounded px-1.5 py-0.5 text-[0.55rem] font-bold uppercase",
                  row.status === "Approved" && "bg-mkt-lime text-mkt-navy",
                  row.status === "In review" && "bg-mkt-sky/35 text-mkt-navy",
                  row.status === "Draft" && "bg-mkt-navy/8 text-mkt-navy/55",
                )}
              >
                {row.status}
              </span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-mkt-navy/8">
              <div
                className={cn(
                  "mkt-hero-progress h-full rounded-full bg-gradient-to-r from-mkt-cta to-mkt-coral",
                  ready && "mkt-hero-progress--in",
                )}
                style={{
                  "--mkt-pct": `${row.pct}%`,
                  ...(ready ? { animationDelay: `${450 + i * 120}ms` } : { width: `${row.pct}%` }),
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {loop ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
        />
      ) : null}
    </div>
  );
}

/** Layered dashboard — same floating theater on all breakpoints, scaled on narrow viewports */
export function HeroDashboardStage({ className }) {
  const { mounted, loop } = useMktMotion();

  const toast = (
    <div className="flex items-center gap-2.5 rounded-2xl border border-mkt-lime/35 bg-white p-3 shadow-xl shadow-mkt-navy/10 sm:gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-mkt-lime text-sm font-bold text-mkt-navy sm:size-10">
        ✓
      </span>
      <div className="min-w-0">
        <p className="text-[0.68rem] font-bold text-mkt-navy sm:text-xs">Client approved</p>
        <p className="text-[0.6rem] leading-snug text-mkt-navy/55 sm:text-[0.65rem]">
          Checkout flow update · 3× faster
        </p>
      </div>
    </div>
  );

  return (
    <MktScaleViewport
      designWidth={580}
      designHeight={500}
      scaleBelow={640}
      className={className}
      innerClassName="relative"
    >
      <div
        className={cn(
          "mkt-hero-stage relative px-6 pt-10 pb-20",
          mounted && "mkt-hero-stage--ready",
        )}
        style={{ width: 580, height: 500 }}
      >
          <div
            aria-hidden
            className="mkt-hero-glow pointer-events-none absolute inset-2 rounded-[2rem] bg-gradient-to-br from-mkt-lime/22 via-mkt-sky/12 to-mkt-coral/18 blur-3xl"
          />

          <div className="mkt-hero-activity absolute left-3 top-5 z-20 w-[162px]">
            <div className={cn(loop && "mkt-hero-float")}>
              <ActivityFeed loop={loop} />
            </div>
          </div>

          <div className="mkt-hero-panel relative z-10 ml-12 mt-14 w-[calc(100%-3rem)] max-w-[468px]">
            <MainDashboard loop={loop} ready={mounted} />
          </div>

          <div className="mkt-hero-toast absolute bottom-6 right-4 z-30 w-[210px]">
            <div className={cn(loop && "mkt-hero-float-slow")}>{toast}</div>
          </div>
      </div>
    </MktScaleViewport>
  );
}
