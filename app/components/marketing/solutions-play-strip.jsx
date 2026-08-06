"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/app/lib/utils";
import { SIGNUP_URL } from "@/app/lib/marketing/site";

import { MKT_EASE, Reveal } from "./motion";

const ROTATE_MS = 5000;

const STEPS = [
  {
    id: "company",
    label: "01 · Company",
    title: "Create the account",
    detail: "Contacts, contracts, and health weights on one record.",
    body: "Every client relationship starts on a single company graph — contacts, SOW, renewal dates, and health configuration live together before any project spins up.",
    role: "Account manager",
    color: "bg-mkt-lime",
    accent: "text-mkt-lime",
    border: "border-mkt-lime/30",
    stats: [
      { label: "Contacts", value: "6" },
      { label: "Health", value: "78" },
      { label: "Renewal", value: "45d" },
    ],
    bullets: [
      "Company record with contract + renewal dates",
      "Configurable health score weights",
      "Touchpoint timeline from day one",
    ],
    mock: "company",
  },
  {
    id: "project",
    label: "02 · Project",
    title: "Spin up delivery",
    detail: "Board, milestones, and budget — linked to the client.",
    body: "Projects inherit the company record. Your PM seeds the board from a retainer template — milestones, budget cap, and portal visibility are wired before kickoff.",
    role: "Project manager",
    color: "bg-mkt-sky",
    accent: "text-mkt-sky",
    border: "border-mkt-sky/30",
    stats: [
      { label: "Milestones", value: "8" },
      { label: "Budget", value: "$42k" },
      { label: "Tasks", value: "34" },
    ],
    bullets: [
      "Board, list, Gantt, and calendar views",
      "Milestone plan with client visibility flags",
      "Budget tracking tied to the project record",
    ],
    mock: "project",
  },
  {
    id: "cr",
    label: "03 · Change request",
    title: "Route scope with guardrails",
    detail: "Impact hours and cost before internal + client approval.",
    body: "Scope shifts move through a state machine — impact assessment, internal sign-off, then client approval in the portal. Budget only updates after explicit approval.",
    role: "Project manager",
    color: "bg-mkt-coral",
    accent: "text-mkt-coral",
    border: "border-mkt-coral/30",
    stats: [
      { label: "Impact", value: "+8h" },
      { label: "Cost", value: "+$3.2k" },
      { label: "Stage", value: "3/5" },
    ],
    bullets: [
      "Impact hours and cost captured upfront",
      "Internal then client approval paths",
      "Audit log on every state transition",
    ],
    mock: "cr",
  },
  {
    id: "portal",
    label: "04 · Portal",
    title: "Client signs off",
    detail: "Approvals sync back — no duplicate entry for your team.",
    body: "Client stakeholders see pending milestones and change requests in a focused portal — internal delivery tools stay hidden while approvals sync back instantly.",
    role: "Client partner",
    color: "bg-mkt-pink",
    accent: "text-mkt-pink",
    border: "border-mkt-pink/30",
    stats: [
      { label: "Pending", value: "2" },
      { label: "Approved", value: "11" },
      { label: "Comments", value: "4" },
    ],
    bullets: [
      "Approve milestones and scope changes",
      "Comment threads on change requests",
      "Zero duplicate data entry for your team",
    ],
    mock: "portal",
  },
];

function WindowChrome({ url, dark = false }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 border-b px-4 py-2.5",
        dark ? "border-white/10 bg-mkt-navy" : "border-mkt-navy/8 bg-[#ececef]",
      )}
    >
      <div className="flex gap-1.5">
        <span className="size-2.5 rounded-full bg-mkt-coral/80" />
        <span className="size-2.5 rounded-full bg-mkt-sun/90" />
        <span className="size-2.5 rounded-full bg-mkt-lime/90" />
      </div>
      <div
        className={cn(
          "mx-auto flex min-w-0 flex-1 items-center justify-center rounded-md px-3 py-1 font-mono text-[0.55rem]",
          dark ? "max-w-[240px] bg-white/10 text-white/55" : "max-w-[260px] bg-white text-mkt-navy/45",
        )}
      >
        <span className="truncate">{url}</span>
      </div>
    </div>
  );
}

function StepMock({ step }) {
  if (step.mock === "company") {
    return (
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl">
        <WindowChrome url="app.meridian.io/companies/northwind" />
        <div className="flex flex-1 flex-col bg-[#f7f8fc] p-3">
          <div className="rounded-xl border border-mkt-navy/10 bg-white p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mkt-display text-lg text-mkt-navy">Northwind Health</p>
                <p className="mt-0.5 text-[0.62rem] text-mkt-navy/45">Retainer · Studio Arc</p>
              </div>
              <span className="rounded-full bg-mkt-coral/15 px-2 py-0.5 font-mono text-[0.5rem] font-bold text-mkt-coral">
                Health 42
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {step.stats.map((s) => (
                <div key={s.label} className="rounded-lg bg-mkt-lime/20 px-1.5 py-1.5 text-center">
                  <p className="font-mkt-display text-base leading-none text-mkt-navy">{s.value}</p>
                  <p className="mt-0.5 text-[0.48rem] uppercase text-mkt-navy/40">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-2 space-y-1.5">
            {[
              { name: "Sarah Chen", role: "Primary contact" },
              { name: "Contract", role: "Renewal Mar 14 · $48k" },
            ].map((row) => (
              <div key={row.name} className="flex items-center gap-2.5 rounded-lg border border-mkt-navy/8 bg-white px-2.5 py-2">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-mkt-navy/8 text-[0.55rem] font-bold text-mkt-navy/50">
                  {row.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[0.72rem] font-semibold text-mkt-navy">{row.name}</p>
                  <p className="text-[0.58rem] text-mkt-navy/45">{row.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step.mock === "project") {
    return (
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl">
        <WindowChrome url="app.meridian.io/projects/q2-brand-retainer" />
        <div className="flex flex-1 flex-col bg-[#f7f8fc] p-3">
          <div className="flex items-center justify-between">
            <p className="font-mkt-display text-base text-mkt-navy">Q2 Brand Retainer</p>
            <span className="rounded-full bg-mkt-sky/25 px-2 py-0.5 text-[0.5rem] font-bold text-mkt-navy">On track</span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {["To do", "In progress", "Done"].map((col, ci) => (
              <div key={col} className="rounded-lg border border-mkt-navy/8 bg-white p-1.5">
                <p className="text-[0.5rem] font-bold uppercase text-mkt-navy/40">{col}</p>
                <div className="mt-1.5 space-y-1">
                  {(ci === 0 ? ["Hero concepts"] : ci === 1 ? ["Brand guidelines"] : ["Kickoff"]).map((task) => (
                    <div key={task} className={cn("rounded px-1.5 py-1 text-[0.58rem] font-medium text-mkt-navy", ci === 2 ? "bg-mkt-lime/25" : "bg-mkt-navy/[0.04]")}>
                      {task}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 rounded-lg border border-mkt-navy/10 bg-white p-2.5">
            <p className="text-[0.5rem] font-bold uppercase text-mkt-navy/40">Milestones</p>
            <div className="mt-1.5 space-y-1.5">
              {[
                { name: "M1 · Discovery", pct: 100 },
                { name: "M2 · Concepts", pct: 72 },
              ].map((m) => (
                <div key={m.name}>
                  <div className="flex justify-between text-[0.58rem]">
                    <span className="font-medium text-mkt-navy">{m.name}</span>
                    <span className="text-mkt-navy/40">{m.pct}%</span>
                  </div>
                  <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-mkt-navy/8">
                    <div className="h-full rounded-full bg-mkt-sky" style={{ width: `${m.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step.mock === "cr") {
    return (
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl">
        <WindowChrome url="app.meridian.io/change-requests/52" />
        <div className="flex flex-1 flex-col bg-mkt-navy p-3 text-white">
          <p className="font-mono text-[0.55rem] uppercase tracking-wider text-white/45">CR #52 · Phase 2 scope</p>
          <p className="mt-1.5 font-mkt-display text-lg">Homepage sections expansion</p>
          <div className="mt-3 flex justify-between gap-1">
            {["draft", "impact", "internal", "client", "live"].map((s, i) => (
              <div key={s} className="flex flex-1 flex-col items-center">
                <span className={cn("size-2 rounded-full", i < 3 ? "bg-mkt-sky" : "bg-white/20")} />
                <span className={cn("mt-1 text-[0.4rem] font-bold uppercase", i < 3 ? "text-mkt-sky" : "text-white/35")}>{s}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {step.stats.map((s) => (
              <div key={s.label} className="rounded-lg bg-white/10 px-1.5 py-1.5 text-center">
                <p className="text-[0.48rem] uppercase text-white/40">{s.label}</p>
                <p className="text-xs font-bold">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1.5">
            {[
              { who: "PM · Sarah K", action: "Impact assessment submitted", time: "Mon 9:04" },
              { who: "System", action: "Client notification sent", time: "Mon 11:23" },
            ].map((log) => (
              <div key={log.action} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5">
                <p className="text-[0.68rem] font-semibold">{log.action}</p>
                <p className="text-[0.55rem] text-white/45">
                  {log.who} · {log.time}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl">
      <WindowChrome dark url="portal.meridian.app/approvals" />
      <div className="flex flex-1 flex-col bg-[#f7f8fc] p-3">
        <div className="rounded-xl border border-mkt-navy/10 bg-white p-3 shadow-sm">
          <p className="font-mono text-[0.55rem] uppercase text-mkt-navy/40">Pending approval</p>
          <p className="mt-1 font-mkt-display text-base text-mkt-navy">Milestone 4 · Brand assets</p>
          <button type="button" className="mt-3 w-full rounded-lg bg-mkt-pink py-2 text-xs font-bold text-white">
            Approve milestone
          </button>
        </div>
        <div className="mt-2 rounded-xl border border-mkt-navy/10 bg-white p-3">
          <p className="font-mono text-[0.55rem] uppercase text-mkt-navy/40">Change request #52</p>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {step.stats.map((s) => (
              <div key={s.label} className="rounded-lg bg-mkt-pink/10 px-1.5 py-1.5 text-center">
                <p className="font-mkt-display text-sm leading-none text-mkt-navy">{s.value}</p>
                <p className="mt-0.5 text-[0.45rem] uppercase text-mkt-navy/40">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 rounded-lg border border-mkt-lime/40 bg-mkt-lime/15 px-2.5 py-2">
          <p className="text-[0.68rem] font-semibold text-mkt-navy">✓ Budget synced · PM notified</p>
        </div>
      </div>
    </div>
  );
}

function FlowPipeline({ active }) {
  return (
    <div className="flex items-center justify-center gap-1 overflow-x-auto px-2 py-4 md:gap-2">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center">
          <div
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 transition md:px-4",
              i === active ? "border-white/30 bg-white/15" : "border-white/10 bg-white/5",
            )}
          >
            <span className={cn("size-2 shrink-0 rounded-full", s.color, i === active ? "ring-2 ring-white/40" : "opacity-60")} />
            <span className={cn("whitespace-nowrap text-[0.62rem] font-bold uppercase tracking-wide md:text-[0.68rem]", i === active ? "text-white" : "text-white/45")}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 ? <span className="mx-1 text-white/20 md:mx-2" aria-hidden>→</span> : null}
        </div>
      ))}
    </div>
  );
}

export function SolutionsPlayStrip() {
  const [active, setActive] = useState(0);
  const pausedRef = useRef(false);
  const step = STEPS[active];

  const goTo = useCallback((index) => {
    setActive((index + STEPS.length) % STEPS.length);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (!pausedRef.current) {
        setActive((i) => (i + 1) % STEPS.length);
      }
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative overflow-hidden bg-mkt-navy py-14 text-white sm:py-20 md:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute -left-32 top-1/4 size-96 rounded-full bg-mkt-lime/10 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute -right-24 bottom-1/4 size-80 rounded-full bg-mkt-sky/10 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-white/40 sm:tracking-[0.35em]">
            Workflow graph
          </p>
          <h2 className="mt-3 font-mkt-display text-[clamp(1.65rem,5vw,3rem)] md:text-5xl">
            Learn by running the workflow
          </h2>
          <p className="mt-3 text-sm text-white/65 sm:mt-4 sm:text-base md:text-lg">
            Tap each step — see how roles hand off on the same graph, Tinker-style experimentation.
          </p>
        </Reveal>

        <div className="mt-8 flex flex-wrap justify-center gap-2 sm:mt-10">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(i)}
              className={cn(
                "rounded-full px-3 py-2 text-[0.625rem] font-bold uppercase tracking-wider transition sm:px-4 sm:text-xs",
                i === active ? "bg-white text-mkt-navy shadow-md" : "bg-white/10 text-white/55 hover:bg-white/15 hover:text-white/80",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: MKT_EASE }}
          className="mx-auto mt-10 max-w-5xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.06] shadow-2xl backdrop-blur-sm"
          onMouseEnter={() => {
            pausedRef.current = true;
          }}
          onMouseLeave={() => {
            pausedRef.current = false;
          }}
        >
          <div className="grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-stretch">
            <div className="flex flex-col justify-center border-b border-white/10 p-6 md:p-8 lg:border-b-0 lg:border-r">
              <div className="flex items-center gap-3">
                <span className={cn("size-3 rounded-full", step.color)} />
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-white/40">{step.role}</p>
              </div>
              <h3 className="mt-3 font-mkt-display text-xl leading-snug md:text-2xl lg:text-3xl">{step.title}</h3>
              <p className="mt-2 text-sm text-white/55">{step.detail}</p>
              <p className="mt-3 text-[0.85rem] leading-relaxed text-white/65 line-clamp-3">{step.body}</p>
              <ul className="mt-4 space-y-2">
                {step.bullets.slice(0, 2).map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-snug text-white/75">
                    <span className={cn("shrink-0 font-bold", step.accent)}>→</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {step.stats.map((stat) => (
                  <div key={stat.label} className={cn("rounded-lg border bg-white/5 px-2 py-2 text-center", step.border)}>
                    <p className="font-mkt-display text-lg leading-none text-white">{stat.value}</p>
                    <p className="mt-1 text-[0.48rem] uppercase tracking-wide text-white/40">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 md:p-5 lg:p-6">
              <div className="h-full max-h-[300px] lg:max-h-[320px]">
                <StepMock step={step} />
              </div>
            </div>
          </div>

          <FlowPipeline active={active} />

          <div className="flex justify-center gap-1.5 border-t border-white/10 pb-5 pt-2">
            {STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to step ${i + 1}`}
                onClick={() => goTo(i)}
                className={cn("h-1 rounded-full transition-all", i === active ? "w-8 bg-mkt-lime" : "w-2 bg-white/20 hover:bg-white/35")}
              />
            ))}
          </div>
        </motion.div>

        <Reveal className="mt-12 text-center">
          <Link
            href={SIGNUP_URL}
            className="inline-flex items-center gap-2 rounded-full bg-mkt-lime px-8 py-3.5 text-sm font-bold text-mkt-navy shadow-lg shadow-mkt-lime/25 transition hover:scale-[1.02]"
          >
            Start experimenting
            <span aria-hidden>→</span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

export function SolutionsTinkerCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:py-20 md:px-6 md:py-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-mkt-lime via-[#d4f55a] to-mkt-sun p-8 text-center sm:rounded-[2rem] sm:p-10 md:p-16">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-white/30 blur-2xl" />
          <h2 className="relative font-mkt-display text-[clamp(1.65rem,5vw,3rem)] text-mkt-navy md:text-5xl">
            Start with your role
          </h2>
          <p className="relative mx-auto mt-3 max-w-lg text-sm text-mkt-navy/70 sm:mt-4 sm:text-base">
            Internal dashboard for delivery teams. Client portal for approvals. One platform — pick where you begin.
          </p>
          <div className="relative mt-6 flex flex-col items-stretch gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
            <Link
              href="/signup"
              className="rounded-full bg-mkt-navy px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-mkt-navy/90 sm:px-8"
            >
              Get started free
            </Link>
            <Link
              href="/product"
              className="rounded-full border border-mkt-navy/20 bg-white/80 px-6 py-3.5 text-sm font-bold text-mkt-navy transition hover:bg-white sm:px-8"
            >
              View product
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
