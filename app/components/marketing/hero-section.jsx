"use client";

import Link from "next/link";

import { SIGNUP_URL, SITE_TAGLINE } from "@/app/lib/marketing/site";

import { FadeIn, StaggerGroup } from "./motion";
import { FloatingOrb } from "./motion-effects";
import { MarkerTag } from "./marker-tag";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-mkt-navy/10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-mkt-sun/30 via-white to-mkt-sky/20" />
      <FloatingOrb
        className="absolute -top-16 -right-16 size-72 rounded-full bg-mkt-pink/30 blur-3xl"
        duration={9}
      />
      <FloatingOrb
        className="absolute top-1/3 -left-20 size-64 rounded-full bg-mkt-lime/35 blur-3xl"
        delay={1.2}
        duration={11}
      />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-2 md:items-center md:px-6 md:py-28">
        <StaggerGroup className="space-y-6" baseDelay={0.05} step={0.1}>
          <MarkerTag tone="sun">Agency client delivery</MarkerTag>
          <h1 className="font-mkt-display text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.05] text-mkt-navy">
            {SITE_TAGLINE}
          </h1>
          <p className="max-w-lg text-lg leading-relaxed text-mkt-navy/80">
            Manage companies, projects, change requests, client portal approvals, retention sequences,
            and health scores in one platform.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/login" className="mkt-btn-secondary">
              Sign in
            </Link>
            <Link href={SIGNUP_URL} className="mkt-btn-primary shadow-lg shadow-mkt-cta/25">
              Create account
            </Link>
          </div>
        </StaggerGroup>

        <FadeIn delay={0.25} className="relative">
          <div className="overflow-hidden rounded-2xl border border-mkt-navy/10 bg-white shadow-2xl shadow-mkt-navy/10">
            <div className="flex items-center gap-2 border-b border-mkt-navy/10 bg-mkt-navy/5 px-4 py-3">
              <span className="size-2.5 rounded-full bg-mkt-coral" />
              <span className="size-2.5 rounded-full bg-mkt-sun" />
              <span className="size-2.5 rounded-full bg-mkt-lime" />
              <span className="ml-2 text-xs font-medium text-mkt-navy/60">App preview</span>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-3">
              {[
                { label: "Companies", value: "Accounts", tone: "bg-mkt-coral/20" },
                { label: "Projects", value: "Delivery", tone: "bg-mkt-sky/25" },
                { label: "Portal", value: "Approvals", tone: "bg-mkt-lime/30" },
              ].map((item) => (
                <div key={item.label} className={`rounded-xl p-3 ${item.tone}`}>
                  <p className="text-lg font-bold text-mkt-navy">{item.value}</p>
                  <p className="text-xs font-medium text-mkt-navy/70">{item.label}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-mkt-navy/10 px-4 py-3 text-xs text-mkt-navy/70">
              Dashboard · Companies · Projects · Change requests · Retention
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
