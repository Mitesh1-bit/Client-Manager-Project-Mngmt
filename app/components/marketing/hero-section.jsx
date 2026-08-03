"use client";

import { heroContent as defaultHero } from "@/app/lib/marketing/site";

import { HeroDashboardStage } from "./hero-dashboard-stage";
import { useMktMotion } from "./motion";
import { cn } from "@/app/lib/utils";

const TRUST_STATS = [
  { value: "500+", label: "Agencies" },
  { value: "12k", label: "Change requests" },
  { value: "98%", label: "On-time delivery" },
];

export function HeroSection({
  headline = defaultHero.headline,
  subhead = defaultHero.subhead,
  primaryCta = defaultHero.primaryCta,
  secondaryCta = defaultHero.secondaryCta,
}) {
  const { mounted } = useMktMotion();

  return (
    <section className="relative overflow-x-clip bg-[#f7f8fc]">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-32 size-[520px] rounded-full bg-mkt-lime/15 blur-[100px]" />
        <div className="absolute -right-32 top-20 size-[480px] rounded-full bg-mkt-sky/12 blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 size-[600px] -translate-x-1/2 rounded-full bg-mkt-coral/8 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(10,21,80,0.07) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-mkt-navy/10 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 md:pb-24 md:pt-14 lg:px-8">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-12 lg:gap-16">
          <div className="relative z-10 order-1 max-w-xl md:max-w-none">
            <div className={cn(mounted && "mkt-animate-fade-in")} style={{ "--mkt-y": "14px" }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-mkt-navy/10 bg-white/80 px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-mkt-navy/55 shadow-sm backdrop-blur-sm">
                <span className="size-1.5 rounded-full bg-mkt-lime" />
                Agency operating system
              </span>
            </div>

            <h1
              className={cn(
                "mt-6 font-mkt-display text-[clamp(2.5rem,6.5vw,4.75rem)] leading-[1.04] tracking-tight text-mkt-navy",
                mounted && "mkt-animate-fade-in",
              )}
              style={{ "--mkt-y": "24px", animationDelay: "60ms" }}
            >
              {headline.split(" ").slice(0, -2).join(" ")}{" "}
              <span className="bg-gradient-to-r from-mkt-navy via-[#1e3a8a] to-mkt-cta bg-clip-text text-transparent">
                {headline.split(" ").slice(-2).join(" ")}
              </span>
            </h1>

            <p
              className={cn(
                "mt-5 max-w-lg text-base leading-relaxed text-mkt-navy/60 md:text-lg",
                mounted && "mkt-animate-fade-in",
              )}
              style={{ "--mkt-y": "16px", animationDelay: "120ms" }}
            >
              {subhead}
            </p>

            <div
              className={cn("mt-8 flex flex-wrap items-center gap-3", mounted && "mkt-animate-fade-in")}
              style={{ "--mkt-y": "12px", animationDelay: "180ms" }}
            >
              <a
                href={primaryCta.href}
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-mkt-navy px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-mkt-navy/25 transition hover:bg-mkt-navy-muted"
              >
                <span className="relative z-10">{primaryCta.label}</span>
              </a>
              <a
                href={secondaryCta.href}
                className="inline-flex items-center justify-center rounded-lg border border-mkt-navy/15 bg-white/70 px-7 py-3.5 text-sm font-bold text-mkt-navy backdrop-blur-sm transition hover:border-mkt-navy/30 hover:bg-white"
              >
                {secondaryCta.label}
              </a>
            </div>

            <div
              className={cn(
                "mt-10 hidden flex-wrap gap-6 border-t border-mkt-navy/8 pt-8 md:flex",
                mounted && "mkt-animate-fade-in",
              )}
              style={{ "--mkt-y": "10px", animationDelay: "240ms" }}
            >
              {TRUST_STATS.map((stat) => (
                <div key={stat.label}>
                  <p className="font-mkt-display text-2xl leading-none text-mkt-navy">{stat.value}</p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wider text-mkt-navy/45">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative order-2 w-full min-w-0 overflow-visible py-2 md:py-4">
            <HeroDashboardStage />
          </div>

          <div
            className={cn(
              "order-3 flex flex-wrap gap-6 border-t border-mkt-navy/8 pt-8 md:hidden",
              mounted && "mkt-animate-fade-in",
            )}
            style={{ "--mkt-y": "10px", animationDelay: "240ms" }}
          >
            {TRUST_STATS.map((stat) => (
              <div key={stat.label}>
                <p className="font-mkt-display text-2xl leading-none text-mkt-navy">{stat.value}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-mkt-navy/45">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent"
      />
    </section>
  );
}
