"use client";

import { motion } from "framer-motion";

import { cn } from "@/app/lib/utils";

import { GridTexture } from "./grid-texture";
import { MKT_EASE, useMktMotion } from "./motion";

const TABS = ["Overview", "Change requests", "Approvals"];

const MOCKUP_CLASS =
  "relative overflow-hidden rounded-2xl border border-mkt-navy/10 bg-white shadow-2xl shadow-mkt-navy/15";

const DEFAULT_STATS = [
  { label: "Active CRs", value: "12", tone: "bg-mkt-block-lime" },
  { label: "Pending", value: "4", tone: "bg-mkt-block-sky" },
  { label: "Approved", value: "28", tone: "bg-mkt-block-sun" },
];

const DEFAULT_ROWS = [
  { title: "Homepage hero refresh", status: "In review", pct: 72 },
  { title: "Checkout flow update", status: "Approved", pct: 100 },
  { title: "Brand guidelines v2", status: "Draft", pct: 35 },
];

/** Animated CRM dashboard mockup for hero / feature sections */
export function CrmMockup({
  className,
  variant = "hero",
  activeTab = 0,
  data,
  skipEntrance = false,
  live = false,
}) {
  const { animate } = useMktMotion();
  const motionEnabled = live || animate;
  const stats = data?.stats ?? DEFAULT_STATS;
  const rows = data?.rows ?? DEFAULT_ROWS;
  const windowTitle = data?.windowTitle ?? "Meridian — Project hub";

  const content = (
    <>
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-mkt-navy/8 bg-mkt-navy/[0.03] px-4 py-3">
        <span className="size-2.5 rounded-full bg-mkt-coral" />
        <span className="size-2.5 rounded-full bg-mkt-sun" />
        <span className="size-2.5 rounded-full bg-mkt-lime" />
        <span className="ml-2 text-xs font-semibold text-mkt-navy/70">{windowTitle}</span>
      </div>

      {/* Tab strip */}
      <div className="flex gap-1 border-b border-mkt-navy/8 px-3 pt-2">
        {TABS.map((tab, i) => (
          <span
            key={tab}
            className={cn(
              "rounded-t-md px-3 py-1.5 text-[0.65rem] font-semibold transition-colors",
              i === activeTab
                ? "bg-white text-mkt-navy shadow-sm"
                : "text-mkt-navy/45",
            )}
          >
            {tab}
          </span>
        ))}
      </div>

      <div className="relative p-4">
        <GridTexture tone="sky" className="opacity-40" />

        {/* Stats row */}
        <div className="relative z-10 mb-4 grid grid-cols-3 gap-2">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={cn("rounded-lg px-2 py-2 text-center", stat.tone)}
            >
              <p className="font-mkt-display text-lg leading-none text-mkt-navy">
                {stat.value}
              </p>
              <p className="mt-0.5 text-[0.55rem] font-medium text-mkt-navy/60">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* CR list */}
        <div className="relative z-10 space-y-2">
          {rows.map((row, i) => {
            const rowBody = (
              <>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[0.7rem] font-semibold text-mkt-navy">{row.title}</p>
                  <span
                    className={cn(
                      "shrink-0 rounded px-1.5 py-0.5 text-[0.55rem] font-bold uppercase",
                      row.status === "Approved" && "bg-mkt-lime text-mkt-navy",
                      row.status === "In review" && "bg-mkt-sky/40 text-mkt-navy",
                      row.status === "Draft" && "bg-mkt-navy/8 text-mkt-navy/60",
                    )}
                  >
                    {row.status}
                  </span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-mkt-navy/8">
                  {motionEnabled ? (
                    <motion.div
                      className="h-full rounded-full bg-mkt-cta"
                      initial={{ width: 0 }}
                      animate={{ width: `${row.pct}%` }}
                      transition={{ delay: 0.9 + i * 0.15, duration: 0.8, ease: MKT_EASE }}
                    />
                  ) : (
                    <div
                      className="h-full rounded-full bg-mkt-cta"
                      style={{ width: `${row.pct}%` }}
                    />
                  )}
                </div>
              </>
            );

            if (!motionEnabled) {
              return (
                <div
                  key={row.title}
                  className="rounded-lg border border-mkt-navy/8 bg-white/90 p-2.5"
                >
                  {rowBody}
                </div>
              );
            }

            return (
              <motion.div
                key={row.title}
                className="rounded-lg border border-mkt-navy/8 bg-white/90 p-2.5"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.12, duration: 0.5, ease: MKT_EASE }}
              >
                {rowBody}
              </motion.div>
            );
          })}
        </div>
      </div>
    </>
  );

  const shellClass = cn(
    MOCKUP_CLASS,
    variant === "hero" ? "w-full max-w-md" : "w-full",
    className,
  );

  if (!motionEnabled || skipEntrance) {
    return <div className={shellClass}>{content}</div>;
  }

  return (
    <motion.div
      className={shellClass}
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.35, ease: MKT_EASE }}
    >
      {content}
    </motion.div>
  );
}

/** Compact agent-style modal mockup for why section */
export function AgentMockup({ className }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-mkt-navy/10 bg-white shadow-xl",
        className,
      )}
    >
      <div className="bg-mkt-navy px-4 py-2.5">
        <p className="text-xs font-bold text-white">Meridian Agent</p>
        <p className="text-[0.65rem] text-white/70">Working on your request…</p>
      </div>
      <div className="space-y-2 p-3">
        {["Company research", "Scope analysis", "Client notification"].map((step, i) => (
          <div
            key={step}
            className="flex items-center gap-2 rounded-lg border border-mkt-navy/8 px-3 py-2"
          >
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full text-[0.6rem] font-bold",
                i < 2 ? "bg-mkt-lime text-mkt-navy" : "bg-mkt-navy/10 text-mkt-navy/50",
              )}
            >
              {i < 2 ? "✓" : "…"}
            </span>
            <span className="text-[0.7rem] font-medium text-mkt-navy">{step}</span>
          </div>
        ))}
        <div className="mt-2 rounded-md bg-mkt-sky/30 px-3 py-2 text-center">
          <span className="text-[0.65rem] font-bold uppercase tracking-wider text-mkt-navy">
            Optimization
          </span>
        </div>
      </div>
    </div>
  );
}

/** SEO-style data table mockup */
export function DataTableMockup({ title, className }) {
  const rows = [
    { kw: "brand refresh", vol: 82, diff: "Med" },
    { kw: "portal login", vol: 64, diff: "Low" },
    { kw: "change request", vol: 91, diff: "High" },
  ];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-mkt-sky/40 bg-mkt-sky/15 p-3",
        className,
      )}
    >
      <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-wider text-mkt-navy/70">
        {title}
      </p>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.kw} className="flex items-center gap-2 text-[0.65rem]">
            <span className="w-24 truncate font-medium text-mkt-navy">{r.kw}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/60">
              <div
                className="h-full rounded-full bg-mkt-navy/40"
                style={{ width: `${r.vol}%` }}
              />
            </div>
            <span className="w-8 text-right text-mkt-navy/50">{r.diff}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
