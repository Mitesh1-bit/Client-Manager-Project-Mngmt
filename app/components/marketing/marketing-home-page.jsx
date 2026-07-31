"use client";

import Link from "next/link";

import { blogPosts } from "@/app/lib/marketing/content";
import { productFeatures, solutionRoles, SIGNUP_URL } from "@/app/lib/marketing/site";

import { AudienceTabs } from "./audience-tabs";
import { ColorBlockCard } from "./color-block-card";
import { HeroSection } from "./hero-section";
import { MarketingGuideCard } from "./marketing-page-shell";
import { ScrollReveal } from "./motion";
import { HoverLift } from "./motion-effects";

function FeatureCard({ feature, index }) {
  return (
    <ScrollReveal delay={index * 0.04}>
      <HoverLift className="h-full">
        <Link href={`/product#${feature.id}`} className="block h-full">
          <ColorBlockCard tone={feature.tone} className="h-full min-h-[11rem] transition-shadow hover:shadow-lg">
            <h3 className="font-mkt-display text-xl md:text-2xl">{feature.title}</h3>
            <p className="mt-3 text-sm leading-relaxed opacity-90">{feature.body}</p>
            <p className="mt-4 text-xs font-bold tracking-wide text-mkt-navy/70 uppercase">Learn more →</p>
          </ColorBlockCard>
        </Link>
      </HoverLift>
    </ScrollReveal>
  );
}

export function MarketingHomePage() {
  return (
    <>
      <HeroSection />

      <section className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-24" id="features">
        <ScrollReveal>
          <h2 className="font-mkt-display text-[clamp(1.75rem,4vw,2.75rem)] text-mkt-navy">
            What Meridian includes
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-mkt-navy/75">
            Every module below is part of the app today — companies, delivery, change control, client
            portal, and retention.
          </p>
          <Link href="/product" className="mt-4 inline-block text-sm font-semibold text-mkt-cta hover:underline">
            Full product overview →
          </Link>
        </ScrollReveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {productFeatures.map((feature, index) => (
            <FeatureCard key={feature.id} feature={feature} index={index} />
          ))}
        </div>
      </section>

      <section className="border-y border-mkt-navy/10 bg-gradient-to-b from-mkt-navy/[0.03] to-white px-4 py-20 md:px-6 md:py-24">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <h2 className="font-mkt-display text-[clamp(1.75rem,4vw,2.75rem)] text-mkt-navy">
              Built for agency roles
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-mkt-navy/75">
              Account managers, project managers, leadership, and client partners each get a focused
              view of the same data.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.08} className="mt-10">
            <AudienceTabs tabs={solutionRoles} />
          </ScrollReveal>
          <ScrollReveal className="mt-8">
            <Link href="/solutions" className="text-sm font-semibold text-mkt-cta hover:underline">
              View all solutions →
            </Link>
          </ScrollReveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-24">
        <ScrollReveal>
          <h2 className="font-mkt-display text-[clamp(1.75rem,4vw,2.75rem)] text-mkt-navy">Guides</h2>
          <p className="mt-4 max-w-2xl text-lg text-mkt-navy/75">
            How change requests and health scores work in Meridian.
          </p>
          <Link href="/blog" className="mt-4 inline-block text-sm font-semibold text-mkt-cta hover:underline">
            All guides →
          </Link>
        </ScrollReveal>
        <ul className="mt-10 grid gap-6 md:grid-cols-2">
          {blogPosts.map((post) => (
            <li key={post.slug}>
              <MarketingGuideCard
                href={`/blog/${post.slug}`}
                date={post.datePublished}
                title={post.title}
                description={post.description}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 md:px-6">
        <ScrollReveal>
          <ColorBlockCard tone="navy" className="relative overflow-hidden text-center">
            <div className="pointer-events-none absolute -top-20 -right-20 size-64 rounded-full bg-mkt-pink/20 blur-3xl" />
            <div className="relative">
              <h2 className="font-mkt-display text-[clamp(1.75rem,4vw,2.75rem)]">
                Start using Meridian
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-white/85">
                Create an account or sign in to manage companies, projects, change requests, and client
                portal access.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href={SIGNUP_URL} className="mkt-btn-primary bg-mkt-cta shadow-lg shadow-black/20">
                  Create account
                </Link>
                <Link
                  href="/product"
                  className="mkt-btn-secondary border-white text-white hover:bg-white hover:text-mkt-navy"
                >
                  Explore product
                </Link>
              </div>
            </div>
          </ColorBlockCard>
        </ScrollReveal>
      </section>
    </>
  );
}
