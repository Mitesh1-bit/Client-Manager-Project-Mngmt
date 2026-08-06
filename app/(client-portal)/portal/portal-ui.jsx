import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/app/lib/utils";

/** Page heading tuned for the client portal — friendly, spacious, clear hierarchy. */
export function PortalPageHeader({ eyebrow, title, description, actions, className }) {
  return (
    <header
      className={cn(
        "portal-page-header flex flex-col gap-4 pb-8 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? <p className="portal-eyebrow">{eyebrow}</p> : null}
        <h1 className="portal-title">{title}</h1>
        {description ? <p className="portal-description">{description}</p> : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:shrink-0">{actions}</div>
      ) : null}
    </header>
  );
}

/** Primary content card — white surface, soft shadow, generous padding. */
export function PortalCard({ children, className, as: Tag = "div", ...props }) {
  return (
    <Tag className={cn("portal-card", className)} {...props}>
      {children}
    </Tag>
  );
}

/** Section title row inside a page or card stack. */
export function PortalSectionHeader({ title, description, action, id }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {id ? (
          <h2 id={id} className="portal-section-title">
            {title}
          </h2>
        ) : (
          <h2 className="portal-section-title">{title}</h2>
        )}
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** High-visibility callout for actions the client must take. */
export function PortalActionBanner({
  icon: Icon,
  title,
  description,
  action,
  tone = "caution",
  children,
}) {
  return (
    <section className={cn("portal-action-banner", `portal-action-banner--${tone}`)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3.5">
          {Icon ? (
            <span className="portal-action-banner__icon" aria-hidden="true">
              <Icon className="size-5" />
            </span>
          ) : null}
          <div className="min-w-0">
            <h2 className="portal-action-banner__title">{title}</h2>
            {description ? <p className="portal-action-banner__text">{description}</p> : null}
            {children}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </section>
  );
}

/** Clickable list row with optional trailing chevron and meta line. */
export function PortalLinkRow({
  href,
  title,
  meta,
  trailing,
  icon: Icon,
  className,
}) {
  return (
    <Link href={href} className={cn("portal-link-row group", className)}>
      {Icon ? (
        <span className="portal-link-row__icon" aria-hidden="true">
          <Icon className="size-4.5" />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-pretty group-hover:text-primary">{title}</span>
        {meta ? <span className="mt-0.5 block text-sm text-muted-foreground">{meta}</span> : null}
      </span>
      {trailing ?? (
        <ChevronRight
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
        />
      )}
    </Link>
  );
}

/** Compact stat tile for overview dashboard. */
export function PortalStatTile({ label, value, hint, href, icon: Icon, accent = "default" }) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon ? (
          <span className={cn("portal-stat-tile__icon", `portal-stat-tile__icon--${accent}`)} aria-hidden="true">
            <Icon className="size-4" />
          </span>
        ) : null}
      </div>
      <p className="portal-stat-tile__value">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn("portal-stat-tile portal-stat-tile--link", `portal-stat-tile--${accent}`)}>
        {inner}
      </Link>
    );
  }

  return <div className={cn("portal-stat-tile", `portal-stat-tile--${accent}`)}>{inner}</div>;
}

/** Welcome hero on the overview — sets tone for the whole portal. */
export function PortalWelcomeHero({ firstName, companyName, awaitingCount }) {
  return (
    <section className="portal-welcome-hero">
      <div className="portal-welcome-hero__glow" aria-hidden="true" />
      <div className="relative">
        <p className="text-sm font-medium text-white/70">Client portal</p>
        <h2 className="mt-1 font-mkt-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Hello, {firstName}
        </h2>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/75">
          Track delivery for <span className="font-medium text-white">{companyName}</span>, approve
          milestones, and request changes — all in one place.
        </p>
        {awaitingCount > 0 ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
            <span className="size-2 rounded-full bg-amber-300" aria-hidden="true" />
            {awaitingCount} waiting on your approval
          </p>
        ) : (
          <p className="mt-4 text-xs text-white/55">You&apos;re all caught up — nothing needs you right now.</p>
        )}
      </div>
    </section>
  );
}

/** Styled back navigation pill. */
export function PortalBackLink({ href, children, className }) {
  return (
    <Link href={href} className={cn("portal-back-link", className)}>
      <ChevronLeft aria-hidden="true" className="size-4 shrink-0" />
      {children}
    </Link>
  );
}

/** Empty state wrapper with portal card styling. */
export function PortalEmptyPanel({ children, className }) {
  return <div className={cn("portal-empty-panel", className)}>{children}</div>;
}
