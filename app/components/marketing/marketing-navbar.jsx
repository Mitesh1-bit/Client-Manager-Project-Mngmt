"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

import { cn } from "@/app/lib/utils";
import {
  LOGIN_URL,
  SIGNUP_URL,
  SITE_NAME,
  navPrimary,
  navProducts,
  navSolutions,
} from "@/app/lib/marketing/site";

function NavDropdown({ label, href, items }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link href={href} className="text-sm font-medium text-mkt-navy hover:text-mkt-cta">
        {label}
      </Link>
      <button
        type="button"
        className="ml-0.5 flex size-6 items-center justify-center rounded text-mkt-navy hover:bg-mkt-sun/40"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${label} menu`}
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden className="text-xs">
          ▾
        </span>
      </button>
      <ul
        id={panelId}
        className={cn(
          "absolute left-0 top-full z-50 mt-2 min-w-[15rem] rounded-lg border border-mkt-navy/10 bg-white py-2 shadow-lg",
          open ? "block" : "hidden",
        )}
      >
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block px-4 py-2 text-sm text-mkt-navy hover:bg-mkt-sun/30"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MarketingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-mkt-navy/10 bg-white/95 backdrop-blur">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-6"
      >
        <Link href="/" className="font-mkt-display text-xl font-normal text-mkt-navy md:text-2xl">
          {SITE_NAME}
        </Link>

        <ul className="hidden items-center gap-6 lg:flex">
          <li>
            <NavDropdown label="Product" href="/product" items={navProducts} />
          </li>
          <li>
            <NavDropdown label="Solutions" href="/solutions" items={navSolutions} />
          </li>
          {navPrimary
            .filter((link) => link.href !== "/product" && link.href !== "/solutions")
            .map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm font-medium text-mkt-navy hover:text-mkt-cta">
                  {link.label}
                </Link>
              </li>
            ))}
        </ul>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href={LOGIN_URL} className="hidden text-sm font-semibold text-mkt-navy sm:inline hover:text-mkt-cta">
            Log in
          </Link>
          <Link href={SIGNUP_URL} className="mkt-btn-primary text-sm">
            Get started
          </Link>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-md border border-mkt-navy/15 text-mkt-navy lg:hidden"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {mobileOpen ? (
        <div className="border-t border-mkt-navy/10 bg-white lg:hidden">
          <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
            <div>
              <p className="text-xs font-bold tracking-widest text-mkt-navy/50 uppercase">Product</p>
              <ul className="mt-2 space-y-1">
                {navProducts.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block py-2 text-sm text-mkt-navy hover:text-mkt-cta"
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-mkt-navy/50 uppercase">Solutions</p>
              <ul className="mt-2 space-y-1">
                {navSolutions.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block py-2 text-sm text-mkt-navy hover:text-mkt-cta"
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Link
                href="/blog"
                className="block py-2 text-sm font-medium text-mkt-navy hover:text-mkt-cta"
                onClick={() => setMobileOpen(false)}
              >
                Guides
              </Link>
            </div>
            <div className="flex gap-3 pt-2">
              <Link
                href={LOGIN_URL}
                className="mkt-btn-secondary flex-1 text-center text-sm"
                onClick={() => setMobileOpen(false)}
              >
                Log in
              </Link>
              <Link
                href={SIGNUP_URL}
                className="mkt-btn-primary flex-1 text-center text-sm"
                onClick={() => setMobileOpen(false)}
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
