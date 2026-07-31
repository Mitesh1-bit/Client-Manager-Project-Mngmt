import Link from "next/link";

import { ScrollReveal } from "@/app/components/marketing/scroll-reveal";
import { LOGIN_URL, SIGNUP_URL } from "@/app/lib/marketing/site";

import { ColorBlockCard } from "./color-block-card";

export function MarketingPageHeader({ title, description, breadcrumb }) {
  return (
    <ScrollReveal>
      <div className="border-b border-mkt-navy/10 bg-gradient-to-br from-mkt-sun/20 via-white to-mkt-sky/10 px-4 py-14 md:px-6 md:py-16">
        <div className="mx-auto max-w-6xl">
          {breadcrumb ? (
            <nav aria-label="Breadcrumb" className="mb-4 text-sm text-mkt-navy/60">
              {breadcrumb}
            </nav>
          ) : null}
          <h1 className="font-mkt-display text-[clamp(2rem,4vw,3.25rem)] leading-tight text-mkt-navy">
            {title}
          </h1>
          {description ? (
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-mkt-navy/80">{description}</p>
          ) : null}
        </div>
      </div>
    </ScrollReveal>
  );
}

export function MarketingBreadcrumb({ items }) {
  return (
    <ol className="flex flex-wrap items-center gap-2">
      {items.map((item, index) => (
        <li key={item.href} className="flex items-center gap-2">
          {index > 0 ? <span aria-hidden className="text-mkt-navy/30">/</span> : null}
          {index === items.length - 1 ? (
            <span className="font-medium text-mkt-navy">{item.label}</span>
          ) : (
            <Link href={item.href} className="hover:text-mkt-cta hover:underline">
              {item.label}
            </Link>
          )}
        </li>
      ))}
    </ol>
  );
}

export function MarketingPageBody({ children, className = "" }) {
  return <div className={`mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16 ${className}`}>{children}</div>;
}

export function MarketingSectionIntro({ title, description, action }) {
  return (
    <ScrollReveal>
      <div className="mb-10">
        <h2 className="font-mkt-display text-[clamp(1.5rem,3vw,2.25rem)] text-mkt-navy">{title}</h2>
        {description ? <p className="mt-3 max-w-2xl text-lg text-mkt-navy/75">{description}</p> : null}
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </ScrollReveal>
  );
}

export function MarketingGuideCard({ href, date, title, description }) {
  return (
    <ScrollReveal>
      <Link
        href={href}
        className="group block h-full rounded-2xl border border-mkt-navy/10 bg-white p-6 shadow-sm transition-all hover:border-mkt-navy/25 hover:shadow-md"
      >
        <time dateTime={date} className="text-sm text-mkt-navy/60">
          {date}
        </time>
        <h3 className="font-mkt-display mt-2 text-xl text-mkt-navy group-hover:text-mkt-cta md:text-2xl">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-mkt-navy/80">{description}</p>
        <p className="mt-4 text-xs font-bold tracking-wide text-mkt-cta uppercase">Read guide →</p>
      </Link>
    </ScrollReveal>
  );
}

export function MarketingCta({
  title = "Ready to use Meridian?",
  description,
  primaryHref = SIGNUP_URL,
  primaryLabel = "Create account",
  secondaryHref = LOGIN_URL,
  secondaryLabel = "Sign in",
}) {
  return (
    <ScrollReveal>
      <div className="mx-auto max-w-6xl px-4 pb-16 md:px-6 md:pb-24">
        <ColorBlockCard tone="navy" className="relative overflow-hidden text-center">
          <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-mkt-pink/20 blur-3xl" />
          <div className="relative">
            <h2 className="font-mkt-display text-2xl md:text-3xl">{title}</h2>
            {description ? <p className="mx-auto mt-3 max-w-xl text-white/85">{description}</p> : null}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href={primaryHref} className="mkt-btn-primary bg-mkt-cta shadow-lg shadow-black/20">
                {primaryLabel}
              </Link>
              <Link
                href={secondaryHref}
                className="mkt-btn-secondary border-white text-white hover:bg-white hover:text-mkt-navy"
              >
                {secondaryLabel}
              </Link>
            </div>
          </div>
        </ColorBlockCard>
      </div>
    </ScrollReveal>
  );
}
