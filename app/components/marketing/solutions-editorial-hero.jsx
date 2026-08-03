"use client";

import Link from "next/link";

import { motion } from "framer-motion";

import { cn } from "@/app/lib/utils";

import { getMktEntrance, MKT_EASE, useMktMotion } from "./motion";

const ROLE_BADGES = [
  {
    id: "account-managers",
    label: "Account managers",
    fill: "bg-mkt-lime shadow-mkt-lime/35",
    glow: "bg-mkt-lime/25",
    style: { top: "8%", left: "0%" },
    delay: 0,
  },
  {
    id: "project-managers",
    label: "Project managers",
    fill: "bg-mkt-sky shadow-mkt-sky/35",
    glow: "bg-mkt-sky/25",
    style: { top: "8%", right: "0%" },
    delay: 0.12,
  },
  {
    id: "leadership",
    label: "Leadership",
    fill: "bg-mkt-sun shadow-mkt-sun/40",
    glow: "bg-mkt-sun/30",
    style: { bottom: "14%", left: "2%" },
    delay: 0.24,
  },
  {
    id: "clients",
    label: "Client partners",
    fill: "bg-[#b8f0a8] shadow-mkt-lime/25",
    glow: "bg-mkt-lime/15",
    style: { bottom: "14%", right: "2%" },
    delay: 0.36,
  },
];

function RoleBadge({ badge, mounted, className }) {
  return (
    <motion.a
      href={`#${badge.id}`}
      {...getMktEntrance(mounted, { y: 12, scale: 0.94, delay: 0.15 + badge.delay, duration: 0.55 })}
      className={cn("group absolute", className)}
      style={badge.style}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 -z-10 scale-110 rounded-full blur-xl opacity-60 transition group-hover:opacity-90",
          badge.glow,
        )}
      />
      <span
        className={cn(
          "mkt-sol-float-badge inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[0.72rem] font-bold text-mkt-navy shadow-lg transition group-hover:-translate-y-1 group-hover:shadow-xl",
          badge.fill,
        )}
      >
        {badge.label}
        <span className="text-mkt-navy/40 transition group-hover:translate-x-0.5 group-hover:text-mkt-navy/70" aria-hidden>
          →
        </span>
      </span>
    </motion.a>
  );
}

export function SolutionsEditorialHero() {
  const { mounted } = useMktMotion();

  return (
    <header className="relative overflow-hidden bg-[#faf9f6] pb-20 pt-10 md:pb-28 md:pt-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(10,21,80,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(10,21,80,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 85% 75% at 50% 42%, black 15%, transparent 78%)",
        }}
      />

      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-1/4 size-72 rounded-full bg-mkt-lime/20 blur-[90px]" />
        <div className="absolute -right-16 top-1/3 size-80 rounded-full bg-mkt-sky/18 blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/3 size-64 rounded-full bg-mkt-sun/22 blur-[80px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-mkt-navy/45">
          <Link href="/" className="transition hover:text-mkt-navy/70">
            Home
          </Link>
          <span className="mx-2 text-mkt-navy/25">/</span>
          <span className="text-mkt-navy/65">Solutions</span>
        </nav>

        <div className="mkt-sol-hero-viewport relative mx-auto mt-14 max-w-5xl md:mt-20">
          <div className="mkt-sol-badge-scaler pointer-events-none absolute inset-0">
            {ROLE_BADGES.map((badge) => (
              <RoleBadge key={badge.id} badge={badge} mounted={mounted} className="pointer-events-auto" />
            ))}
          </div>

          <div className="relative z-10 mx-auto max-w-3xl px-2 text-center md:px-20 lg:px-24">
            <motion.p
              {...getMktEntrance(mounted, { y: 10, duration: 0.5 })}
              className="font-mono text-[0.65rem] uppercase tracking-[0.35em] text-mkt-navy/45"
            >
              Solutions by role
            </motion.p>

            <motion.h1
              {...getMktEntrance(mounted, { y: 20, delay: 0.08, duration: 0.65 })}
              className="mt-6 font-mkt-display text-[clamp(2.35rem,5.5vw,4.5rem)] leading-[1.08] tracking-tight text-mkt-navy"
            >
              Agency solutions{" "}
              <span className="relative inline-block">
                <em className="relative z-10 not-italic text-mkt-coral">by role</em>
                <motion.span
                  aria-hidden
                  className="absolute -bottom-1 left-0 right-0 h-[0.22em] rounded-full bg-gradient-to-r from-mkt-lime via-mkt-sky to-mkt-sun"
                  initial={mounted ? { scaleX: 0 } : false}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.35, duration: 0.6, ease: MKT_EASE }}
                  style={{ transformOrigin: "left center" }}
                />
              </span>
            </motion.h1>

            <motion.p
              {...getMktEntrance(mounted, { y: 14, delay: 0.16, duration: 0.55 })}
              className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-mkt-navy/58 md:text-[1.05rem]"
            >
              Pick a role — see the exact workflow, permissions, and screen your team uses. Same company
              record, scoped for internal delivery or client portal.
            </motion.p>

            <motion.div
              {...getMktEntrance(mounted, { y: 12, delay: 0.28, duration: 0.5 })}
              className="mt-10 flex flex-wrap items-center justify-center gap-3"
            >
              <a
                href="#role-studio"
                className="inline-flex items-center gap-2 rounded-full bg-mkt-navy px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-mkt-navy/15 transition hover:bg-mkt-navy/92"
              >
                Explore roles
                <span className="text-white/70" aria-hidden>
                  ↓
                </span>
              </a>
              <Link
                href="/product"
                className="inline-flex items-center gap-2 rounded-full border-2 border-mkt-sky/40 bg-white px-7 py-3.5 text-sm font-semibold text-mkt-navy shadow-sm transition hover:border-mkt-sky hover:shadow-md"
              >
                Product modules
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </header>
  );
}
