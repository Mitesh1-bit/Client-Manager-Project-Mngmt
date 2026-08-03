"use client";

import { cn } from "@/app/lib/utils";

export function LogoMarquee({ logos, className }) {
  return (
    <section
      className={cn(
        "overflow-hidden border-y border-mkt-navy/8 bg-white py-8",
        className,
      )}
      aria-label="Trusted by teams"
    >
      <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.25em] text-mkt-navy/45">
        Built for modern agency teams
      </p>

      <div className="relative overflow-hidden">
        {/* Edge fade — keeps marquee readable like Wispr/Jasper partner strips */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent md:w-24"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent md:w-24"
        />

        <div className="mkt-marquee-track flex w-max items-center">
          {[0, 1].map((copy) => (
            <div
              key={copy}
              aria-hidden={copy === 1 ? true : undefined}
              className="flex shrink-0 items-center gap-12 px-6 md:gap-16 md:px-8"
            >
              {logos.map((name) => (
                <span
                  key={`${copy}-${name}`}
                  className="shrink-0 whitespace-nowrap font-mkt-display text-xl text-mkt-navy/25 md:text-2xl"
                >
                  {name}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
