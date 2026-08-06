"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/app/lib/utils";
import {
  LOGIN_URL,
  SIGNUP_URL,
  SITE_NAME,
  navPrimary,
  navProducts,
  navSolutions,
} from "@/app/lib/marketing/site";

import { MKT_EASE, useMktMotion } from "./motion";

const ACCENT_DOT = {
  lime: "bg-mkt-lime",
  sky: "bg-mkt-sky",
  coral: "bg-mkt-coral",
  sun: "bg-mkt-sun",
  pink: "bg-mkt-pink",
  navy: "bg-mkt-navy",
};

function Chevron({ open, className }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 12 12"
      className={cn("size-3 shrink-0 transition-transform duration-200", open && "rotate-180", className)}
      fill="none"
    >
      <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NavMegaMenu({
  label,
  href,
  items,
  overviewTitle,
  overviewDescription,
  overviewCta,
  isOpen,
  onOpen,
  onClose,
}) {
  const panelId = useId();
  const pathname = usePathname();
  const isSectionActive = pathname === href || pathname.startsWith(`${href}/`);
  const featured = items[0];
  const links = items.slice(1);

  return (
    <div className="relative" onMouseEnter={onOpen} onMouseLeave={onClose}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        className={cn(
          "mkt-nav-trigger group inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[0.9rem] font-medium transition-colors",
          isSectionActive || isOpen ? "text-mkt-navy" : "text-mkt-navy/65 hover:text-mkt-navy",
        )}
        onClick={() => (isOpen ? onClose() : onOpen())}
        onFocus={onOpen}
      >
        {label}
        <Chevron open={isOpen} />
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            id={panelId}
            role="region"
            aria-label={`${label} menu`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: MKT_EASE }}
            className="mkt-nav-panel absolute left-1/2 top-[calc(100%+0.65rem)] z-50 w-[min(calc(100vw-2rem),40rem)] -translate-x-1/2 overflow-hidden rounded-2xl border border-mkt-navy/10 bg-white shadow-[0_28px_70px_-16px_rgba(10,21,80,0.22)]"
          >
            <div className="grid md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
              <div className="border-b border-mkt-navy/8 bg-gradient-to-br from-mkt-navy via-[#101c66] to-[#0a1550] p-5 md:border-b-0 md:border-r">
                <p className="font-mono text-[0.55rem] uppercase tracking-[0.24em] text-white/40">{label}</p>
                <p className="mt-2 font-mkt-display text-xl leading-snug text-white">{overviewTitle}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{overviewDescription}</p>
                {featured ? (
                  <Link
                    href={featured.href}
                    className="mt-4 block rounded-xl border border-white/10 bg-white/10 p-3 transition hover:border-mkt-lime/40 hover:bg-white/15"
                    onClick={onClose}
                  >
                    <p className="text-sm font-semibold text-white">{featured.label}</p>
                    {featured.description ? (
                      <p className="mt-1 text-xs leading-snug text-white/50">{featured.description}</p>
                    ) : null}
                  </Link>
                ) : null}
                <Link
                  href={href}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-mkt-lime transition hover:gap-2.5"
                  onClick={onClose}
                >
                  {overviewCta ?? "Explore all"}
                  <span aria-hidden>→</span>
                </Link>
              </div>

              <ul className="grid gap-0.5 p-2 sm:grid-cols-2">
                {links.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="group flex h-full items-start gap-2.5 rounded-xl px-3 py-2.5 transition hover:bg-mkt-navy/[0.04]"
                      onClick={onClose}
                    >
                      <span
                        className={cn(
                          "mt-1.5 size-2 shrink-0 rounded-full",
                          ACCENT_DOT[item.accent] ?? "bg-mkt-navy/30",
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-mkt-navy">{item.label}</span>
                        {item.description ? (
                          <span className="mt-0.5 block text-xs leading-snug text-mkt-navy/48">{item.description}</span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function MobileAccordion({ title, href, items, onNavigate }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-mkt-navy/8">
      <div className="flex items-center justify-between gap-3 py-3.5">
        <Link href={href} className="font-mkt-display text-lg text-mkt-navy" onClick={onNavigate}>
          {title}
        </Link>
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-full border border-mkt-navy/10 text-mkt-navy"
          aria-expanded={open}
          aria-label={`${open ? "Collapse" : "Expand"} ${title} links`}
          onClick={() => setOpen((value) => !value)}
        >
          <Chevron open={open} />
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: MKT_EASE }}
            className="overflow-hidden pb-3"
          >
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-start gap-3 rounded-lg px-2 py-2.5 text-sm hover:bg-mkt-navy/[0.04]"
                  onClick={onNavigate}
                >
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", ACCENT_DOT[item.accent] ?? "bg-mkt-navy/30")} />
                  <span>
                    <span className="block font-semibold text-mkt-navy">{item.label}</span>
                    {item.description ? (
                      <span className="mt-0.5 block text-xs text-mkt-navy/50">{item.description}</span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function MarketingNavbar() {
  const pathname = usePathname();
  const { animate, reduce } = useMktMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);

  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const closeMenus = useCallback(() => setOpenMenu(null), []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    closeMenus();
    closeMobile();
  }, [pathname, closeMenus, closeMobile]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") {
        closeMenus();
        closeMobile();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeMenus, closeMobile]);

  const guidesLink = navPrimary.find((link) => link.href === "/blog");

  return (
    <>
      <header
        className={cn(
          "mkt-navbar sticky top-0 z-50 transition-[background-color,box-shadow,border-color] duration-300",
          scrolled
            ? "border-b border-mkt-navy/8 bg-[#faf9f6]/95 shadow-[0_10px_40px_-14px_rgba(10,21,80,0.14)] backdrop-blur-xl"
            : "border-b border-mkt-navy/5 bg-white/80 backdrop-blur-lg",
        )}
      >
        <nav
          aria-label="Primary"
          className="mx-auto grid max-w-7xl grid-cols-[minmax(0,auto)_1fr_auto] items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6 lg:gap-6 lg:py-3.5"
        >
          <Link href="/" className="group inline-flex shrink-0 items-center gap-2.5 min-w-0">
            <span className="relative flex size-8 shrink-0 items-center justify-center rounded-xl bg-mkt-navy shadow-sm transition group-hover:shadow-md">
              <span className="size-2.5 shrink-0 rounded-full bg-mkt-lime" />
            </span>
            <span className="truncate font-mkt-display text-lg font-bold tracking-tight text-mkt-navy sm:text-xl">
              {SITE_NAME}
            </span>
          </Link>

          <div className="hidden justify-center lg:flex">
            <div
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-1 transition-colors duration-300",
                scrolled ? "border-mkt-navy/10 bg-white/90 shadow-sm" : "border-transparent bg-transparent",
              )}
            >
              <NavMegaMenu
                label="Product"
                href="/product"
                items={navProducts}
                overviewTitle="The delivery stack"
                overviewDescription="Five modules on one record graph — from account to portal approvals."
                overviewCta="See the platform"
                isOpen={openMenu === "product"}
                onOpen={() => setOpenMenu("product")}
                onClose={closeMenus}
              />
              <NavMegaMenu
                label="Solutions"
                href="/solutions"
                items={navSolutions}
                overviewTitle="Built for your role"
                overviewDescription="Account managers, PMs, leadership, and clients — each with their own workflow."
                overviewCta="Browse by role"
                isOpen={openMenu === "solutions"}
                onOpen={() => setOpenMenu("solutions")}
                onClose={closeMenus}
              />
              {guidesLink ? (
                <Link
                  href={guidesLink.href}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-[0.9rem] font-medium transition-colors",
                    pathname.startsWith("/blog") ? "text-mkt-navy" : "text-mkt-navy/65 hover:text-mkt-navy",
                  )}
                >
                  {guidesLink.label}
                </Link>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 sm:gap-3">
            <Link
              href={LOGIN_URL}
              className="hidden rounded-full px-3.5 py-2 text-sm font-semibold text-mkt-navy/70 transition hover:bg-mkt-navy/[0.04] hover:text-mkt-navy md:inline-flex"
            >
              Log in
            </Link>
            <Link
              href={SIGNUP_URL}
              className="inline-flex items-center gap-1.5 rounded-full bg-mkt-navy px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_28px_-10px_rgba(10,21,80,0.55)] transition hover:bg-[#121f6b] sm:px-5"
            >
              <span className="hidden sm:inline">Get started</span>
              <span className="sm:hidden">Start</span>
              <span aria-hidden className="text-mkt-lime">→</span>
            </Link>
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-full border border-mkt-navy/12 bg-white text-mkt-navy lg:hidden"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen((open) => !open)}
            >
              <span className="relative block size-4">
                <span className={cn("absolute left-0 top-0.5 block h-0.5 w-4 rounded-full bg-current transition-all duration-300", mobileOpen && "top-[7px] rotate-45")} />
                <span className={cn("absolute left-0 top-[7px] block h-0.5 w-4 rounded-full bg-current transition-all duration-300", mobileOpen && "opacity-0")} />
                <span className={cn("absolute left-0 top-3 block h-0.5 w-4 rounded-full bg-current transition-all duration-300", mobileOpen && "top-[7px] -rotate-45")} />
              </span>
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Close menu overlay"
              className="fixed inset-0 z-40 bg-mkt-navy/25 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.2 }}
              onClick={closeMobile}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              className="fixed inset-x-3 top-[4.25rem] z-50 max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-2xl border border-mkt-navy/10 bg-white shadow-2xl lg:hidden"
              initial={animate && !reduce ? { opacity: 0, y: -10, scale: 0.98 } : false}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={animate && !reduce ? { opacity: 0, y: -8, scale: 0.98 } : undefined}
              transition={{ duration: 0.25, ease: MKT_EASE }}
            >
              <div className="px-4 py-5 sm:px-5">
                <MobileAccordion title="Product" href="/product" items={navProducts} onNavigate={closeMobile} />
                <MobileAccordion title="Solutions" href="/solutions" items={navSolutions} onNavigate={closeMobile} />
                {guidesLink ? (
                  <Link
                    href={guidesLink.href}
                    className="block border-b border-mkt-navy/8 py-4 font-mkt-display text-lg text-mkt-navy"
                    onClick={closeMobile}
                  >
                    {guidesLink.label}
                  </Link>
                ) : null}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Link href={LOGIN_URL} className="mkt-btn-secondary rounded-xl py-3 text-center text-sm" onClick={closeMobile}>
                    Log in
                  </Link>
                  <Link
                    href={SIGNUP_URL}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-mkt-navy py-3 text-center text-sm font-bold text-white"
                    onClick={closeMobile}
                  >
                    Get started
                    <span aria-hidden className="text-mkt-lime">→</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
