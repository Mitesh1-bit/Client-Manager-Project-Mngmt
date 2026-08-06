"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/app/lib/utils";
import { roleStackSectionContent, solutionRoles } from "@/app/lib/marketing/site";

import { Reveal } from "./motion";
import { MktScaleViewport } from "./mkt-scale-viewport";

const ROTATE_MS = 4500;

const STACK_ORDER = ["account-managers", "project-managers", "leadership", "clients"];

const ROLE_ACCENT = {
  "account-managers": "bg-mkt-lime",
  "project-managers": "bg-mkt-sky",
  leadership: "bg-mkt-sun",
  clients: "bg-mkt-pink",
};

const STACK_META = {
  "account-managers": {
    header: "bg-mkt-lime",
    title: "Account health",
    visual: "health",
    access: "Internal · Dashboard",
    stats: [
      { label: "At risk", value: "3" },
      { label: "Touchpoints", value: "18" },
      { label: "Renewals", value: "6" },
    ],
    activity: [
      { name: "Northwind Health", detail: "Renewal in 45 days", tone: "coral" },
      { name: "Summit Apps", detail: "Touchpoint overdue · 12d", tone: "sun" },
      { name: "Brightline Co", detail: "Health ↑ 8 pts this week", tone: "lime" },
    ],
  },
  "project-managers": {
    header: "bg-mkt-sky",
    title: "Change requests",
    visual: "cr",
    access: "Internal · Projects",
    stats: [
      { label: "Open CRs", value: "8" },
      { label: "In review", value: "5" },
      { label: "Blocked", value: "2" },
    ],
    activity: [
      { name: "CR #52", detail: "Phase 2 scope · client pending", tone: "sky" },
      { name: "CR #48", detail: "API integration · internal review", tone: "lime" },
      { name: "CR #41", detail: "Brand refresh · approved", tone: "navy" },
    ],
  },
  leadership: {
    header: "bg-mkt-sun",
    title: "Org overview",
    visual: "org",
    access: "Internal · Leadership",
    stats: [
      { label: "Projects", value: "47" },
      { label: "Clients", value: "22" },
      { label: "Health avg", value: "78" },
    ],
    activity: [
      { name: "Delivery", detail: "12 projects on track", tone: "lime" },
      { name: "Retention", detail: "3 accounts flagged at-risk", tone: "coral" },
      { name: "Pipeline", detail: "$840k renewals this quarter", tone: "sun" },
    ],
  },
  clients: {
    header: "bg-mkt-pink",
    title: "Client portal",
    visual: "portal",
    access: "Portal · Client only",
    stats: [
      { label: "Pending", value: "3" },
      { label: "Approved", value: "11" },
      { label: "Comments", value: "7" },
    ],
    activity: [
      { name: "Milestone 4", detail: "Brand assets · awaiting sign-off", tone: "pink" },
      { name: "CR #52", detail: "Phase 2 scope · review requested", tone: "sky" },
      { name: "Document pack", detail: "Q3 report · shared yesterday", tone: "navy" },
    ],
  },
};

const ACTIVITY_TONE = {
  coral: "border-mkt-coral/25 bg-mkt-coral/8 text-mkt-coral",
  sun: "border-mkt-sun/35 bg-mkt-sun/15 text-mkt-navy/70",
  lime: "border-mkt-lime/40 bg-mkt-lime/15 text-mkt-navy/70",
  sky: "border-mkt-sky/30 bg-mkt-sky/10 text-mkt-navy/70",
  pink: "border-mkt-pink/25 bg-mkt-pink/10 text-mkt-navy/70",
  navy: "border-mkt-navy/12 bg-mkt-navy/[0.04] text-mkt-navy/60",
};

function stackDepth(index, active, total) {
  return (index - active + total) % total;
}

function CardVisual({ type }) {
  if (type === "health") {
    return (
      <div className="flex min-h-0 flex-col rounded-xl border border-mkt-navy/8 bg-white p-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mkt-display text-4xl leading-none text-mkt-coral">42</p>
            <p className="mt-1.5 font-mono text-[0.58rem] uppercase tracking-wider text-mkt-navy/45">Northwind health</p>
          </div>
          <span className="rounded-full border border-mkt-coral/30 bg-mkt-coral/10 px-2 py-0.5 font-mono text-[0.5rem] font-bold uppercase text-mkt-coral">
            At risk
          </span>
        </div>
        <div className="mt-4 flex w-full gap-2">
          {[
            { label: "NW", v: 42, tone: "bg-mkt-coral/50" },
            { label: "SA", v: 88, tone: "bg-mkt-lime/50" },
            { label: "SM", v: 55, tone: "bg-mkt-sun/50" },
          ].map((row) => (
            <div key={row.label} className="flex-1 text-center">
              <div className={cn("mx-auto w-full max-w-[44px] rounded-t", row.tone)} style={{ height: row.v * 0.45 }} />
              <p className="mt-1 font-mono text-[0.48rem] text-mkt-navy/40">{row.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-auto space-y-1.5 border-t border-mkt-navy/8 pt-3">
          {[
            ["Renewal", "Mar 14 · $48k ARR"],
            ["Open CRs", "2 pending approval"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-2 text-[0.68rem]">
              <span className="text-mkt-navy/45">{k}</span>
              <span className="font-medium text-mkt-navy/75">{v}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "cr") {
    return (
      <div className="flex min-h-0 flex-col rounded-xl border border-mkt-navy/8 bg-mkt-navy p-3 text-white">
        <div className="flex items-start justify-between gap-2">
          <p className="font-mono text-[0.6rem] uppercase tracking-wider text-white/45">CR #52 · Phase 2 scope</p>
          <span className="shrink-0 rounded-full bg-mkt-sky/25 px-2 py-0.5 font-mono text-[0.5rem] font-bold uppercase text-mkt-sky">
            Client pending
          </span>
        </div>
        <div className="mt-5 flex justify-between gap-1">
          {["draft", "impact", "internal", "client", "live"].map((s, i) => (
            <div key={s} className="flex flex-1 flex-col items-center">
              <span className={cn("size-2.5 rounded-full", i < 3 ? "bg-mkt-sky" : "bg-white/20")} />
              <span className={cn("mt-1.5 text-[0.45rem] font-bold uppercase", i < 3 ? "text-mkt-sky" : "text-white/35")}>
                {s}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/15">
          <div className="h-full w-3/5 rounded-full bg-mkt-lime" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {[
            ["Impact", "+8h"],
            ["Cost", "+$3,200"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-white/8 px-2 py-1.5">
              <p className="text-[0.48rem] uppercase tracking-wide text-white/40">{k}</p>
              <p className="text-xs font-bold">{v}</p>
            </div>
          ))}
        </div>
        <p className="mt-auto pt-3 font-mono text-[0.55rem] text-white/50">Client pending · due Fri</p>
      </div>
    );
  }

  if (type === "org") {
    return (
      <div className="flex min-h-0 flex-col rounded-xl border border-mkt-navy/8 bg-[#fef9e6] p-2.5">
        <svg viewBox="0 0 140 90" className="mx-auto w-full max-w-[160px]" aria-hidden>
          <circle cx={70} cy={45} r={11} fill="#ffe24a" />
          {[
            [28, 28],
            [112, 28],
            [28, 68],
            [112, 68],
          ].map(([cx, cy], i) => (
            <g key={i}>
              <line x1={70} y1={45} x2={cx} y2={cy} stroke="#0a1550" strokeWidth={1.5} opacity={0.12} />
              <circle cx={cx} cy={cy} r={6} fill="#4ec0e8" opacity={0.7} />
            </g>
          ))}
          <text x={70} y={49} textAnchor="middle" className="fill-mkt-navy text-[8px] font-bold">
            ORG
          </text>
        </svg>
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {[
            ["Projects", "47"],
            ["Health avg", "78"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg border border-mkt-navy/8 bg-white/80 px-2 py-1.5">
              <p className="text-[0.48rem] uppercase tracking-wide text-mkt-navy/40">{k}</p>
              <p className="font-mkt-display text-base leading-none text-mkt-navy">{v}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col rounded-xl border border-mkt-navy/8 bg-[#fce8f0] p-2.5">
      <div className="mx-auto w-full max-w-[180px] flex-1 rounded-[1.2rem] border border-mkt-navy/10 bg-white p-3 shadow-md">
        <div className="mx-auto h-1.5 w-10 rounded-full bg-mkt-navy/10" />
        <p className="mt-4 text-center text-base font-bold text-mkt-navy">Milestone 4</p>
        <p className="mt-1 text-center text-[0.68rem] text-mkt-navy/50">Brand assets · Phase 2</p>
        <p className="mt-5 w-full rounded-xl bg-mkt-pink py-2.5 text-center text-sm font-bold text-white">Approve</p>
        <p className="mt-3 text-center font-mono text-[0.55rem] text-mkt-lime">✓ internal tools hidden</p>
      </div>
      <div className="mt-2 space-y-1.5">
        {[
          ["Pending", "Milestone 4"],
          ["Change req", "CR #52"],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-2 rounded-md border border-mkt-navy/8 bg-white/70 px-2 py-1.5 text-[0.62rem]">
            <span className="font-semibold text-mkt-navy/55">{k}</span>
            <span className="text-mkt-navy/70">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StackCard({ role, index, depth, isFront }) {
  const meta = STACK_META[role.id];

  return (
    <article data-stack={index} data-depth={depth} className="mkt-role-stack-card">
      <header className={cn("mkt-role-stack-header", meta.header)}>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-mkt-coral/80" aria-hidden />
          <span className="size-2.5 rounded-full bg-mkt-sun/90" aria-hidden />
          <span className="size-2.5 rounded-full bg-mkt-lime/90" aria-hidden />
          <h3 className="ml-1">{meta.title}</h3>
        </div>
        {isFront ? (
          <span className="mkt-role-stack-live rounded-full bg-white/70 px-2.5 py-0.5 font-mono text-[0.55rem] font-bold uppercase tracking-wider text-mkt-navy/55">
            Live
          </span>
        ) : null}
      </header>
      <div className="mkt-role-stack-body">
        <div className="mkt-role-stack-visual">
          <CardVisual type={meta.visual} />
        </div>
        <div className="mkt-role-stack-copy">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-mkt-navy/40">{role.label}</p>
            <span className="rounded-full border border-mkt-navy/10 bg-mkt-navy/[0.04] px-2 py-0.5 font-mono text-[0.52rem] uppercase tracking-wide text-mkt-navy/45">
              {meta.access}
            </span>
          </div>
          <h4 className="mt-2 font-mkt-display text-base font-bold leading-snug text-mkt-navy sm:text-lg">{role.headline}</h4>
          <p className="mt-2 text-[0.78rem] leading-relaxed text-mkt-navy/60 line-clamp-2">{role.body}</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {meta.stats.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-mkt-navy/8 bg-mkt-navy/[0.03] px-2 py-2 text-center">
                <p className="font-mkt-display text-lg leading-none text-mkt-navy">{stat.value}</p>
                <p className="mt-1 text-[0.48rem] uppercase tracking-wide text-mkt-navy/40">{stat.label}</p>
              </div>
            ))}
          </div>
          <ul className="mt-3 space-y-1.5">
            {role.bullets?.slice(0, 2).map((item) => (
              <li key={item} className="flex gap-2 text-[0.72rem] leading-snug text-mkt-navy/75">
                <span className="shrink-0 font-bold text-mkt-coral">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-mkt-navy/8 pt-3">
            <p className="font-mono text-[0.5rem] uppercase tracking-[0.18em] text-mkt-navy/35">Recent activity</p>
            <ul className="mt-2 space-y-1.5">
              {meta.activity.slice(0, 2).map((row) => (
                <li
                  key={row.name}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-[0.68rem]",
                    ACTIVITY_TONE[row.tone],
                  )}
                >
                  <span className="font-semibold">{row.name}</span>
                  <span className="truncate text-right opacity-80">{row.detail}</span>
                </li>
              ))}
            </ul>
          </div>
          <Link
            href={`#${role.id}`}
            className="mt-3 inline-flex items-center gap-1.5 text-[0.78rem] font-bold text-mkt-coral transition hover:gap-2.5"
          >
            View full workflow
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

export function SolutionsRoleStack() {
  const roles = STACK_ORDER.map((id) => solutionRoles.find((r) => r.id === id)).filter(Boolean);
  const count = roles.length;
  const [active, setActive] = useState(0);
  const pausedRef = useRef(false);
  const copy = roleStackSectionContent;

  const goTo = useCallback(
    (index) => {
      setActive((index + count) % count);
    },
    [count],
  );

  useEffect(() => {
    const id = setInterval(() => {
      if (!pausedRef.current) {
        setActive((i) => (i + 1) % count);
      }
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [count]);

  return (
    <section className="mkt-role-stack-section relative overflow-x-clip border-y border-mkt-navy/8 py-14 sm:py-16 md:py-20 lg:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(10,21,80,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(10,21,80,0.035) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="grid min-w-0 items-start gap-10 sm:gap-12 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-12 xl:gap-16"
          onMouseEnter={() => {
            pausedRef.current = true;
          }}
          onMouseLeave={() => {
            pausedRef.current = false;
          }}
        >
          {/* Left — page-level copy only */}
          <div className="order-2 max-w-lg lg:order-1 lg:max-w-none">
            <Reveal>
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-mkt-navy/45 sm:tracking-[0.35em]">
                {copy.eyebrow}
              </p>
              <h2 className="mt-3 font-mkt-display text-[clamp(1.65rem,5vw,2.75rem)] text-mkt-navy lg:text-[2.75rem] lg:leading-tight">
                {copy.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-mkt-navy/60 sm:mt-4 sm:text-base">{copy.subtitle}</p>
            </Reveal>

            <ul className="mt-8 space-y-5 border-t border-mkt-navy/10 pt-8 sm:mt-10 sm:space-y-6 sm:pt-10">
              {copy.points.map((point) => (
                <li key={point.title}>
                  <p className="font-mkt-display text-lg text-mkt-navy">{point.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-mkt-navy/60">{point.body}</p>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-2 sm:mt-10">
              {roles.map((role, i) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => goTo(i)}
                  className={cn(
                    "inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-2 text-[0.625rem] font-semibold shadow-sm transition sm:px-4 sm:text-[0.68rem]",
                    i === active
                      ? "border-mkt-navy/25 bg-mkt-navy text-white shadow-md"
                      : "border-mkt-navy/12 bg-white text-mkt-navy hover:border-mkt-navy/22 hover:shadow-md",
                  )}
                >
                  <span className={cn("size-1.5 shrink-0 rounded-full", ROLE_ACCENT[role.id])} />
                  <span className="truncate">
                    {String(i + 1).padStart(2, "0")} {role.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right — full data cards (shown first on mobile) */}
          <div className="order-1 mkt-role-stack-wrap mx-auto w-full min-w-0 lg:order-2 lg:mx-0">
            <MktScaleViewport
              designWidth={768}
              designHeight={440}
              topInset={60}
              scaleBelow={1024}
              innerClassName="mkt-role-stack-canvas"
            >
              <div className="mkt-role-stack-glow" aria-hidden />
              <div
                className="mkt-role-stack mkt-role-stack--split mkt-role-stack--canvas"
                aria-live="polite"
                style={{ width: 720, height: 440 }}
              >
                {roles.map((role, i) => (
                  <StackCard
                    key={role.id}
                    role={role}
                    index={i}
                    depth={stackDepth(i, active, count)}
                    isFront={i === active}
                  />
                ))}
              </div>
            </MktScaleViewport>
          </div>
        </div>
      </div>
    </section>
  );
}
