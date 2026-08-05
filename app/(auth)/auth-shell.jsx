"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/app/lib/utils";
import { LOGIN_URL, SIGNUP_URL } from "@/app/lib/marketing/site";
import { MKT_EASE } from "@/app/components/marketing/motion";

const PIPELINE = [
  { label: "Client", color: "bg-mkt-lime" },
  { label: "Project", color: "bg-mkt-sky" },
  { label: "Change req", color: "bg-mkt-coral" },
  { label: "Portal", color: "bg-mkt-pink" },
];

function AuthDashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white shadow-[0_32px_64px_rgba(0,0,0,0.35)]">
        <div className="flex items-center gap-2 border-b border-mkt-navy/8 bg-mkt-navy/[0.03] px-4 py-3">
          <span className="size-2.5 rounded-full bg-mkt-coral/90" />
          <span className="size-2.5 rounded-full bg-mkt-sun/90" />
          <span className="size-2.5 rounded-full bg-mkt-lime/90" />
          <span className="ml-1 text-xs font-semibold text-mkt-navy/60">Meridian — Delivery hub</span>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: "12", l: "Open CRs", c: "bg-mkt-lime/30" },
              { v: "4", l: "Pending", c: "bg-mkt-sky/25" },
              { v: "78", l: "Health", c: "bg-mkt-sun/30" },
            ].map((s) => (
              <div key={s.l} className={cn("rounded-lg px-2 py-2.5 text-center", s.c)}>
                <p className="font-mkt-display text-lg leading-none text-mkt-navy">{s.v}</p>
                <p className="mt-0.5 text-[0.55rem] font-medium text-mkt-navy/50">{s.l}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            {[
              { t: "Phase 2 scope · CR #52", p: 68, s: "Client review" },
              { t: "Brand retainer · Q2", p: 91, s: "On track" },
            ].map((row) => (
              <div key={row.t} className="rounded-lg border border-mkt-navy/8 bg-[#f8f9fc] px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[0.72rem] font-semibold text-mkt-navy">{row.t}</p>
                  <span className="shrink-0 rounded bg-mkt-sky/30 px-1.5 py-0.5 text-[0.55rem] font-bold uppercase text-mkt-navy/70">
                    {row.s}
                  </span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-mkt-navy/8">
                  <div className="h-full rounded-full bg-mkt-cta" style={{ width: `${row.p}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthPipeline() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((i) => (i + 1) % PIPELINE.length), 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mt-10">
      <div className="relative flex items-center justify-between">
        <div className="absolute left-4 right-4 top-1/2 h-px -translate-y-1/2 bg-white/15" aria-hidden />
        {PIPELINE.map((step, i) => (
          <div key={step.label} className="relative flex flex-col items-center gap-2">
            <span
              className={cn(
                "size-3 rounded-full ring-4 ring-mkt-navy transition-all duration-500",
                step.color,
                i === active ? "scale-125 ring-white/20" : "opacity-50",
              )}
            />
            <span className={cn("text-[0.62rem] font-medium", i === active ? "text-white" : "text-white/40")}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuthBrandPanel() {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-mkt-navy p-10 text-white xl:p-14 lg:flex">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(78,192,232,0.18), transparent 55%), radial-gradient(ellipse 60% 50% at 100% 100%, rgba(197,240,66,0.12), transparent 50%)",
        }}
      />

      <div className="relative">
        <Link href="/" className="font-mkt-display text-2xl tracking-tight text-white">
          Meridian
        </Link>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: MKT_EASE }}
          className="mt-10 max-w-sm font-mkt-display text-[2rem] leading-[1.15] xl:text-4xl"
        >
          Client delivery,
          <span className="text-mkt-lime"> one operating system.</span>
        </motion.h2>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
          Clients, projects, change requests, and portal approvals — connected on one graph.
        </p>
      </div>

      <div className="relative flex-1 py-10">
        <AuthDashboardPreview />
        <AuthPipeline />
      </div>

      <p className="relative text-xs text-white/35">© {new Date().getFullYear()} Meridian Studio</p>
    </aside>
  );
}

export function AuthShell({ children }) {
  const pathname = usePathname();
  const isSignup = pathname === "/signup";

  return (
    <div className="grid h-full lg:grid-cols-2">
      <AuthBrandPanel />

      <div className="flex min-h-0 flex-col bg-white">
        <header className="flex shrink-0 items-center justify-between px-6 py-4 lg:px-10 lg:py-5">
          <Link href="/" className="font-mkt-display text-xl text-mkt-navy lg:hidden">
            Meridian
          </Link>
          <span className="hidden lg:block" aria-hidden />
          <Link
            href={isSignup ? LOGIN_URL : SIGNUP_URL}
            className="text-sm font-semibold text-mkt-navy/55 transition hover:text-mkt-navy"
          >
            {isSignup ? "Sign in" : "Create account"}
          </Link>
        </header>

        <main id="main" className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-6 pb-8 lg:px-12 xl:px-16">
          <div className="w-full max-w-[400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function AuthPageHeader({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h1 className="font-mkt-display text-[1.875rem] tracking-tight text-mkt-navy">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm text-mkt-navy/55">{subtitle}</p> : null}
    </div>
  );
}

export function AuthPageFooter({ children }) {
  return <p className="mt-6 text-center text-sm text-mkt-navy/55">{children}</p>;
}

export function authInputClass(compact = false) {
  return cn(
    "rounded-lg border-mkt-navy/12 bg-white shadow-none focus-visible:border-mkt-sky/50 focus-visible:ring-2 focus-visible:ring-mkt-sky/20",
    compact ? "h-10 text-sm" : "h-11",
  );
}
