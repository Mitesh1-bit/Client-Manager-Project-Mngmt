"use client";

import Link from "next/link";

import { SIGNUP_URL } from "@/app/lib/marketing/site";

import { Reveal } from "./motion";

const PROOF_STATS = [
  { value: "500+", label: "Agencies", tone: "from-[#2563eb]/90 to-[#38bdf8]/70" },
  { value: "12k", label: "Change requests", tone: "from-[#1e40af]/90 to-[#2563eb]/65" },
  { value: "98%", label: "On-time delivery", tone: "from-[#0a1550]/90 to-[#1e3a8a]/75" },
];

export function StartDeliveringCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 md:px-6">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#0a1550] via-[#0f2060] to-[#1e3a8a] shadow-2xl shadow-mkt-navy/30">
          <div
            aria-hidden
            className="mkt-cta-glow pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-[#2563eb]/35 blur-3xl"
          />
          <div
            aria-hidden
            className="mkt-cta-glow pointer-events-none absolute -bottom-28 -left-24 size-80 rounded-full bg-[#38bdf8]/25 blur-3xl"
            style={{ animationDelay: "1.2s" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.14]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.22) 1px, transparent 0)",
              backgroundSize: "26px 26px",
            }}
          />

          <div className="relative grid items-center gap-10 p-8 md:grid-cols-[1.05fr_0.95fr] md:gap-12 md:p-12 lg:p-14">
            <div className="text-center md:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/75">
                <span className="size-1.5 rounded-full bg-[#38bdf8]" />
                Ready when you are
              </span>

              <h2 className="mt-5 font-mkt-display text-4xl leading-[1.05] text-white md:text-5xl lg:text-6xl">
                Start{" "}
                <span className="bg-gradient-to-r from-[#38bdf8] via-[#60a5fa] to-white bg-clip-text text-transparent">
                  delivering
                </span>
              </h2>

              <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-white/75 md:mx-0 md:text-lg">
                See where Meridian takes your agency — companies, projects, change requests, and
                client approvals in one flow.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                <Link
                  href={SIGNUP_URL}
                  className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3.5 text-sm font-bold text-mkt-navy shadow-lg shadow-black/10 transition hover:bg-[#38bdf8]/20 hover:text-white"
                >
                  Create account
                </Link>
                <Link
                  href="/product"
                  className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 px-8 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition hover:border-white/45 hover:bg-white/10"
                >
                  Explore product
                </Link>
              </div>

              <p className="mt-4 text-xs text-white/45">Free to start · No credit card required</p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              {PROOF_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className={`mkt-cta-stat flex h-[5.25rem] w-[5.25rem] flex-col items-center justify-center rounded-2xl bg-gradient-to-br p-2 text-center sm:h-[5.75rem] sm:w-[5.75rem] ${stat.tone}`}
                >
                  <p className="font-mkt-display text-xl leading-none text-white sm:text-2xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 max-w-[4.25rem] text-[0.42rem] font-semibold uppercase leading-tight tracking-wide text-white/75 sm:text-[0.45rem]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
