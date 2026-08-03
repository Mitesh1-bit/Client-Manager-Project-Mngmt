"use client";

import Link from "next/link";

import { MarketingPageBody } from "@/app/components/marketing/marketing-page-shell";
import { MarketingInnerHero } from "@/app/components/marketing/marketing-inner-hero";
import { Reveal } from "@/app/components/marketing/motion";

export function BlogPostBody({ post, breadcrumb }) {
  return (
    <>
      <MarketingInnerHero title={post.title} description={post.description} breadcrumb={breadcrumb} tone="sky" />

      <MarketingPageBody className="max-w-3xl">
        <Reveal>
          <aside className="rounded-xl border border-mkt-sun bg-mkt-sun/30 p-5 shadow-sm">
            <p className="text-xs font-bold tracking-widest text-mkt-navy/70 uppercase">Summary</p>
            <p className="mt-2 font-medium text-mkt-navy">{post.directAnswer}</p>
          </aside>
        </Reveal>

        <Reveal delay={0.1} className="prose-marketing mt-10">
          {post.body.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </Reveal>

        <Reveal delay={0.15} className="mt-10 flex flex-wrap gap-4 border-t border-mkt-navy/10 pt-8">
          <Link href="/blog" className="text-sm font-semibold text-mkt-cta hover:underline">
            ← All guides
          </Link>
          <Link
            href="/product"
            className="text-sm font-semibold text-mkt-navy hover:text-mkt-cta hover:underline"
          >
            Product overview →
          </Link>
        </Reveal>
      </MarketingPageBody>
    </>
  );
}
