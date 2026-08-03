"use client";

import {
  MarketingBreadcrumb,
  MarketingCta,
  MarketingGuideCard,
  MarketingPageBody,
  MarketingSectionIntro,
} from "@/app/components/marketing/marketing-page-shell";
import { MarketingInnerHero } from "@/app/components/marketing/marketing-inner-hero";
import { Reveal } from "@/app/components/marketing/motion";

export function BlogMarketingPage({ posts }) {
  return (
    <>
      <MarketingInnerHero
        title="Product guides for agencies"
        description="Short guides explaining how Meridian features work — based on the shipped product."
        breadcrumb={
          <MarketingBreadcrumb
            items={[
              { href: "/", label: "Home" },
              { href: "/blog", label: "Guides" },
            ]}
          />
        }
        tone="sun"
      />

      <MarketingPageBody>
        <MarketingSectionIntro
          title="Product guides"
          description="Learn how change requests and health scores work before you sign in."
        />
        <ul className="grid gap-6 md:grid-cols-2">
          {posts.map((post, i) => (
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
      </MarketingPageBody>

      <MarketingCta
        title="Try these features in the app"
        description="Create an account to run change requests, health scoring, and retention in your organization."
      />
    </>
  );
}
