"use client";

import Link from "next/link";

import { blogPosts } from "@/app/lib/marketing/content";
import {
  beforeAfterContent,
  faqContent,
  heroContent,
  logoMarqueeItems,
  personaShowcaseContent,
  playLearnContent,
  productFeatures,
  toolCarouselContent,
  whyMeridianContent,
} from "@/app/lib/marketing/site";

import { BeforeAfterShowcase } from "./before-after-showcase";
import { StartDeliveringCta } from "./start-delivering-cta";
import { FaqSection, PlayLearnSection } from "./faq-section";
import { FeatureBentoGrid } from "./feature-bento-grid";
import { HeroSection } from "./hero-section";
import { LogoMarquee } from "./logo-marquee";
import { MarketingGuideCard } from "./marketing-page-shell";
import { PersonaShowcase } from "./persona-showcase";
import { Reveal } from "./motion";
import { ToolCarousel } from "./tool-carousel";
import { WhyMeridianSection } from "./why-meridian-section";

export function MarketingHomePage() {
  return (
    <>
      <HeroSection {...heroContent} />

      <LogoMarquee logos={logoMarqueeItems} />

      <ToolCarousel {...toolCarouselContent} tools={productFeatures} />

      <BeforeAfterShowcase {...beforeAfterContent} />

      <FeatureBentoGrid
        title="Built for how agencies work"
        subtitle="Interactive modules with live animations — hover each card to explore."
        features={[
          {
            title: "Change control",
            description:
              "Scope changes move through impact assessment, internal approval, and client sign-off — with a full audit trail.",
            tone: "lime",
            illustration: "agents",
            href: "/product#change-requests",
          },
          {
            title: "Delivery pipeline",
            description:
              "Board, list, Gantt, and calendar views on one project record linked to the client account.",
            tone: "coral",
            illustration: "pipelines",
            href: "/product#projects",
          },
          {
            title: "Client portal",
            description:
              "Client stakeholders approve milestones and change requests in a focused portal.",
            tone: "sky",
            illustration: "portal",
            href: "/product#portal",
          },
        ]}
      />

      <WhyMeridianSection {...whyMeridianContent} />

      <PersonaShowcase {...personaShowcaseContent} />

      <PlayLearnSection {...playLearnContent} />

      <FaqSection {...faqContent} />

      <section className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-mkt-display text-4xl text-mkt-navy md:text-5xl">Guides</h2>
          <p className="mt-4 text-base text-mkt-navy/70 md:text-lg">
            How change requests and health scores work in Meridian.
          </p>
          <Link
            href="/blog"
            className="mt-4 inline-block text-sm font-semibold text-mkt-cta hover:underline"
          >
            All guides →
          </Link>
        </Reveal>
        <ul className="mt-12 grid gap-6 md:grid-cols-2">
          {blogPosts.map((post, i) => (
            <li key={post.slug}>
              <Reveal delay={i * 0.1}>
                <MarketingGuideCard
                  href={`/blog/${post.slug}`}
                  date={post.datePublished}
                  title={post.title}
                  description={post.description}
                />
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <StartDeliveringCta />
    </>
  );
}
