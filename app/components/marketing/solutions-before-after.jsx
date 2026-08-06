"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";

import { cn } from "@/app/lib/utils";

import { MKT_EASE, Reveal, useMktInView } from "./motion";

const BEFORE_EMAILS = [
  { from: "Sarah K · PM", subject: "Re: CR #47 — can you confirm scope?", time: "2h ago", unread: true },
  { from: "Client · Northwind", subject: "Re: Re: waiting on legal review…", time: "Yesterday", unread: true },
  { from: "Finance", subject: "Fwd: CR #47 — budget still locked?", time: "2d ago", unread: false },
  { from: "You", subject: "Re: Re: Re: still no sign-off from client", time: "3d ago", unread: false },
  { from: "Sarah K · PM", subject: "CR #47 — who owns client approval?", time: "5d ago", unread: false },
];

const AFTER_STEPS = [
  { label: "CR submitted", detail: "Impact +$3,200 logged", status: "done", time: "Mon 9:04" },
  { label: "Internal approval", detail: "Delivery lead signed off", status: "done", time: "Mon 11:22" },
  { label: "Client notified", detail: "Portal invite sent automatically", status: "done", time: "Mon 11:23" },
  { label: "Signed in portal", detail: "Northwind · Phase 2 scope", status: "live", time: "Tue 8:41" },
  { label: "Budget unlocked", detail: "+$3,200 added to project", status: "live", time: "Tue 8:41" },
];

const METRICS = {
  before: [
    { value: "5.2d", label: "Avg approval time" },
    { value: "12", label: "Email replies" },
    { value: "Locked", label: "Budget status" },
  ],
  after: [
    { value: "18h", label: "Avg approval time" },
    { value: "0", label: "Email threads" },
    { value: "Live", label: "Budget status" },
  ],
};

function WindowChrome({ title, url, tone = "neutral" }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 border-b px-4 py-2.5",
        tone === "dark" ? "border-white/10 bg-mkt-navy" : "border-mkt-navy/8 bg-[#ececef]",
      )}
    >
      <div className="flex gap-1.5">
        <span className="size-2.5 rounded-full bg-mkt-coral/80" />
        <span className="size-2.5 rounded-full bg-mkt-sun/90" />
        <span className="size-2.5 rounded-full bg-mkt-lime/90" />
      </div>
      <div
        className={cn(
          "mx-auto flex min-w-0 max-w-[220px] flex-1 items-center justify-center rounded-md px-3 py-1 font-mono text-[0.55rem]",
          tone === "dark" ? "bg-white/10 text-white/55" : "bg-white text-mkt-navy/45",
        )}
      >
        <span className="truncate">{url || title}</span>
      </div>
    </div>
  );
}

function BeforeMock({ play }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-mkt-navy/10 bg-white shadow-lg">
      <WindowChrome title="Inbox" url="mail.agency.com · 47 unread" />
      <div className="flex items-center justify-between border-b border-mkt-navy/8 bg-mkt-coral/8 px-4 py-2.5">
        <p className="text-[0.68rem] font-bold text-mkt-coral">CR #47 · Budget locked</p>
        <span className="rounded-full bg-mkt-coral/15 px-2 py-0.5 font-mono text-[0.55rem] font-bold uppercase text-mkt-coral">
          5 days waiting
        </span>
      </div>
      <div className="flex-1 space-y-0 overflow-hidden p-1">
        {BEFORE_EMAILS.slice(0, 4).map((mail, i) => (
          <motion.div
            key={mail.subject}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: play ? i * 0.08 : 0, duration: 0.35, ease: MKT_EASE }}
            className={cn(
              "flex gap-2.5 border-b border-mkt-navy/5 px-3 py-2 last:border-0",
              mail.unread ? "bg-mkt-coral/[0.04]" : "bg-white",
            )}
          >
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-mkt-navy/8 text-[0.55rem] font-bold text-mkt-navy/50">
              {mail.from.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className={cn("truncate text-[0.72rem] font-semibold", mail.unread ? "text-mkt-navy" : "text-mkt-navy/65")}>
                  {mail.from}
                </p>
                <span className="shrink-0 font-mono text-[0.55rem] text-mkt-navy/35">{mail.time}</span>
              </div>
              <p className={cn("mt-0.5 truncate text-[0.68rem]", mail.unread ? "font-medium text-mkt-navy/80" : "text-mkt-navy/45")}>
                {mail.subject}
              </p>
            </div>
            {mail.unread ? <span className="mt-1 size-2 shrink-0 rounded-full bg-mkt-coral" /> : null}
          </motion.div>
        ))}
      </div>
      <div className="border-t border-mkt-navy/8 bg-[#f7f7f8] px-4 py-3">
        <p className="font-mono text-[0.58rem] text-mkt-navy/40">
          12 replies · 3 inboxes · nobody knows if client approved
        </p>
      </div>
    </div>
  );
}

function AfterMock({ play }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-mkt-navy/10 bg-white shadow-lg">
      <WindowChrome tone="dark" url="portal.meridian.app/approvals" />
      <div className="flex flex-1 flex-col bg-[#f7f8fc] p-3">
        <div className="rounded-xl border border-mkt-navy/10 bg-white p-3 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-mono text-[0.55rem] uppercase tracking-wider text-mkt-navy/40">Change request #47</p>
              <p className="mt-1 font-mkt-display text-base text-mkt-navy">Phase 2 scope expansion</p>
            </div>
            <span className="shrink-0 rounded-full bg-mkt-lime/35 px-2 py-0.5 font-mono text-[0.5rem] font-bold uppercase text-mkt-navy">
              Approved
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {[
              ["Impact", "+8h"],
              ["Cost", "+$3,200"],
              ["Timeline", "+5d"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-mkt-navy/[0.04] px-1.5 py-1.5 text-center">
                <p className="text-[0.48rem] uppercase text-mkt-navy/40">{k}</p>
                <p className="text-xs font-bold text-mkt-navy">{v}</p>
              </div>
            ))}
          </div>
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: play ? 0.35 : 0.1, duration: 0.4, ease: MKT_EASE }}
            className="mt-3 w-full rounded-lg bg-mkt-lime py-2 text-center text-xs font-bold text-mkt-navy"
          >
            ✓ Signed by Northwind · Tue 8:41 AM
          </motion.div>
        </div>

        <div className="mt-3 space-y-1.5">
          {AFTER_STEPS.slice(0, 3).map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: play ? 0.15 + i * 0.07 : i * 0.04, duration: 0.35, ease: MKT_EASE }}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2",
                step.status === "live"
                  ? "border-mkt-lime/50 bg-mkt-lime/20"
                  : "border-mkt-navy/8 bg-white",
              )}
            >
              <div className="min-w-0">
                <p className="text-[0.72rem] font-semibold text-mkt-navy">{step.label}</p>
                <p className="truncate text-[0.58rem] text-mkt-navy/45">{step.detail}</p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[0.48rem] font-bold uppercase",
                  step.status === "live" ? "bg-mkt-navy text-white" : "bg-mkt-navy/10 text-mkt-navy/55",
                )}
              >
                {step.status}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CopyPanel({ mode }) {
  const isBefore = mode === "before";

  return (
    <div className="flex flex-col justify-center p-6 md:p-8 lg:p-10">
      <span
        className={cn(
          "w-fit rounded-full px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider",
          isBefore ? "bg-mkt-coral/20 text-mkt-coral" : "bg-mkt-lime/40 text-mkt-navy",
        )}
      >
        {isBefore ? "Before" : "After"}
      </span>
      <p className="mt-4 font-mkt-display text-xl leading-snug text-mkt-navy md:text-2xl lg:text-3xl">
        {isBefore ? "Email thread chaos" : "One portal sign-off"}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-mkt-navy/65">
        {isBefore
          ? "CR #47 bounces between inboxes. Nobody knows if the client approved. Budget stays locked while delivery waits."
          : "Client approves in the portal. Budget unlocks automatically. Audit trail logs every transition — your PM sees it instantly."}
      </p>
      <ul className="mt-5 space-y-2">
        {(isBefore
          ? [
              "12+ replies across PM, finance, and client",
              "No single source of truth for approval status",
              "Budget frozen until someone finds the right email",
            ]
          : [
              "Client signs off in a dedicated portal view",
              "Impact hours and cost captured before approval",
              "Budget updates the moment client approves",
            ]
        ).map((item) => (
          <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-mkt-navy/75">
            <span className={cn("shrink-0 font-bold", isBefore ? "text-mkt-coral" : "text-mkt-lime")}>
              {isBefore ? "✕" : "✓"}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MetricsStrip({ mode }) {
  const metrics = METRICS[mode];

  return (
    <div className="grid grid-cols-3 divide-x divide-mkt-navy/8 border-t border-mkt-navy/8 bg-white">
      {metrics.map((m) => (
        <div key={m.label} className="px-2 py-4 text-center sm:px-4 md:px-6 md:py-5">
          <p
            className={cn(
              "font-mkt-display text-xl leading-none sm:text-2xl md:text-3xl",
              mode === "before" && m.label === "Budget status" ? "text-mkt-coral" : "",
              mode === "after" && m.label === "Budget status" ? "text-mkt-lime" : "",
              m.label !== "Budget status" ? "text-mkt-navy" : "",
            )}
          >
            {m.value}
          </p>
          <p className="mt-1.5 text-[0.55rem] uppercase tracking-wide text-mkt-navy/40 sm:mt-2 sm:text-[0.62rem]">{m.label}</p>
        </div>
      ))}
    </div>
  );
}

function ComparisonStage({ play, mode }) {
  const isBefore = mode === "before";

  return (
    <motion.div
      key={mode}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: MKT_EASE }}
      className={cn(
        "overflow-hidden rounded-[1.75rem] border border-mkt-navy/10 shadow-xl",
        isBefore ? "bg-[#f3f3f3]" : "bg-[#eef8dc]",
      )}
    >
      <div className="grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-stretch">
        <CopyPanel mode={mode} />
        <div className="border-t border-mkt-navy/8 p-4 md:p-5 lg:border-l lg:border-t-0 lg:p-6">
          <div className="h-full max-h-[340px] lg:max-h-[380px]">
            {isBefore ? <BeforeMock play={play} /> : <AfterMock play={play} />}
          </div>
        </div>
      </div>
      <MetricsStrip mode={mode} />
    </motion.div>
  );
}

export function SolutionsBeforeAfter() {
  const ref = useRef(null);
  const inView = useMktInView(ref, { amount: 0.25 });
  const reduce = useReducedMotion();
  const play = inView && !reduce;
  const [mode, setMode] = useState("before");

  return (
    <section ref={ref} className="bg-white py-14 sm:py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-mkt-navy/45 sm:tracking-[0.35em]">
            Same change request
          </p>
          <h2 className="mt-3 font-mkt-display text-[clamp(1.65rem,5vw,3rem)] text-mkt-navy md:text-5xl">
            Meridian in real delivery
          </h2>
          <p className="mt-3 text-sm text-mkt-navy/65 sm:mt-4 sm:text-base md:text-lg">
            Before and after — one CR, two completely different experiences for your team and client.
          </p>
        </Reveal>

        <div className="mt-10 flex justify-center">
          <div className="inline-flex rounded-full border border-mkt-navy/10 bg-mkt-navy/[0.04] p-1 shadow-sm">
            {["before", "after"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-full px-6 py-2.5 text-sm font-semibold capitalize transition",
                  mode === m ? "bg-mkt-navy text-white shadow-md" : "text-mkt-navy/55 hover:text-mkt-navy",
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mx-auto mt-12 max-w-5xl">
          <ComparisonStage play={play} mode={mode} />
        </div>
      </div>
    </section>
  );
}
