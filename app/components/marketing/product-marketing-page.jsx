"use client";

import Link from "next/link";

import { JsonLd, breadcrumbJsonLd } from "@/app/components/marketing/json-ld";
import {
  ProductModuleBands,
  ProductProofLine,
  ProductStackRiver,
  ProductWeekChapters,
} from "@/app/components/marketing/product-delivery-experience";
import { ProductHeroOrbit } from "@/app/components/marketing/product-hero-orbit";
import { MarketingBreadcrumb } from "@/app/components/marketing/marketing-page-shell";
import { useMktMotion } from "@/app/components/marketing/motion";
import { StartDeliveringCta } from "@/app/components/marketing/start-delivering-cta";
import {
  metadataBase,
  productFeatures,
  productPageContent,
  SIGNUP_URL,
} from "@/app/lib/marketing/site";

import { cn } from "@/app/lib/utils";

function ProductPageHero({ hero }) {
  const { mounted } = useMktMotion();

  return (
    <header className="relative overflow-x-hidden bg-[#f7f8fc]">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-32 size-[520px] rounded-full bg-mkt-lime/18 blur-[100px]" />
        <div className="absolute -right-32 top-20 size-[480px] rounded-full bg-mkt-sky/14 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 size-[500px] rounded-full bg-mkt-coral/10 blur-[110px]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(10,21,80,0.07) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 md:pb-24 md:pt-14 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-mkt-navy/45">
          <MarketingBreadcrumb
            items={[
              { href: "/", label: "Home" },
              { href: "/product", label: "Product" },
            ]}
          />
        </nav>

        <div className="mt-8 grid items-center gap-10 md:grid-cols-2 md:gap-12 lg:gap-16">
          <div className="max-w-xl">
            <div className={cn(mounted && "mkt-animate-fade-in")} style={{ "--mkt-y": "14px" }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-mkt-navy/10 bg-white/80 px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-mkt-navy/55 shadow-sm backdrop-blur-sm">
                <span className="size-1.5 rounded-full bg-mkt-lime" />
                Meridian platform
              </span>
            </div>

            <h1
              className={cn(
                "mt-6 font-mkt-display text-[clamp(2.5rem,6.5vw,4.75rem)] leading-[1.04] tracking-tight text-mkt-navy",
                mounted && "mkt-animate-fade-in",
              )}
              style={{ "--mkt-y": "24px", animationDelay: "60ms" }}
            >
              {hero.title.split(" ").slice(0, -2).join(" ")}{" "}
              <span className="bg-gradient-to-r from-mkt-navy via-mkt-coral to-mkt-cta bg-clip-text text-transparent">
                {hero.title.split(" ").slice(-2).join(" ")}
              </span>
            </h1>

            <p
              className={cn(
                "mt-5 max-w-lg text-base leading-relaxed text-mkt-navy/60 md:text-lg",
                mounted && "mkt-animate-fade-in",
              )}
              style={{ "--mkt-y": "16px", animationDelay: "120ms" }}
            >
              {hero.description}
            </p>

            <div
              className={cn("mt-6 flex flex-wrap gap-2", mounted && "mkt-animate-fade-in")}
              style={{ "--mkt-y": "12px", animationDelay: "160ms" }}
            >
              {hero.pills.map((pill) => (
                <span
                  key={pill}
                  className="rounded-full border border-mkt-navy/10 bg-white/70 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-mkt-navy/55"
                >
                  {pill}
                </span>
              ))}
            </div>

            <div
              className={cn("mt-8 flex flex-wrap items-center gap-3", mounted && "mkt-animate-fade-in")}
              style={{ "--mkt-y": "12px", animationDelay: "200ms" }}
            >
              <Link
                href={SIGNUP_URL}
                className="inline-flex items-center justify-center rounded-lg bg-mkt-navy px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-mkt-navy/25 transition hover:bg-mkt-navy-muted"
              >
                Create account
              </Link>
              <a
                href="#companies"
                className="inline-flex items-center justify-center rounded-lg border border-mkt-navy/15 bg-white/70 px-7 py-3.5 text-sm font-bold text-mkt-navy backdrop-blur-sm transition hover:border-mkt-navy/30 hover:bg-white"
              >
                Explore layers ↓
              </a>
            </div>
          </div>

          <div className="min-w-0 overflow-visible py-2 sm:py-0">
            <ProductHeroOrbit />
          </div>
        </div>
      </div>
    </header>
  );
}

export function ProductMarketingPage() {
  const crumbs = breadcrumbJsonLd([
    { name: "Home", url: metadataBase },
    { name: "Product", url: `${metadataBase}/product` },
  ]);
  const page = productPageContent;

  return (
    <>
      <JsonLd data={crumbs} />
      <ProductPageHero hero={page.hero} />
      <ProductStackRiver title={page.platformFlow.title} subtitle={page.platformFlow.subtitle} />
      <ProductWeekChapters
        title={page.scenarios.title}
        subtitle={page.scenarios.subtitle}
        items={page.scenarios.items}
      />
      <ProductModuleBands
        title={page.atlas.title}
        subtitle={page.atlas.subtitle}
        modules={productFeatures}
      />
      <ProductProofLine title={page.proof.title} items={page.proof.items} />
      <div className="bg-white pb-8">
        <StartDeliveringCta />
      </div>
    </>
  );
}
