import Link from "next/link";

import { ColorBlockCard } from "@/app/components/marketing/color-block-card";
import { JsonLd, breadcrumbJsonLd } from "@/app/components/marketing/json-ld";
import {
  MarketingBreadcrumb,
  MarketingCta,
  MarketingPageBody,
  MarketingPageHeader,
  MarketingSectionIntro,
} from "@/app/components/marketing/marketing-page-shell";
import { ScrollReveal } from "@/app/components/marketing/scroll-reveal";
import { metadataBase, productFeatures } from "@/app/lib/marketing/site";

export const metadata = {
  title: "Product",
  description:
    "Meridian product — companies, projects, change requests, client portal, and retention for agency client delivery.",
  alternates: { canonical: "/product" },
};

export default function ProductPage() {
  const crumbs = breadcrumbJsonLd([
    { name: "Home", url: metadataBase },
    { name: "Product", url: `${metadataBase}/product` },
  ]);

  return (
    <>
      <JsonLd data={crumbs} />
      <MarketingPageHeader
        title="Product"
        description="Modules shipped in Meridian today — from client accounts through delivery, change control, portal access, and retention."
        breadcrumb={
          <MarketingBreadcrumb
            items={[
              { href: "/", label: "Home" },
              { href: "/product", label: "Product" },
            ]}
          />
        }
      />
      <MarketingPageBody>
        <MarketingSectionIntro
          title="Platform modules"
          description="Each module maps to a section of the app your team uses daily."
        />
        <div className="space-y-8">
          {productFeatures.map((section, index) => (
            <ScrollReveal key={section.id} delay={index * 0.05}>
              <section id={section.id} className="scroll-mt-28">
                <ColorBlockCard tone={section.tone}>
                  <h2 className="font-mkt-display text-2xl md:text-3xl">{section.title}</h2>
                  <p className="mt-4 max-w-3xl leading-relaxed">{section.body}</p>
                  {section.bullets?.length ? (
                    <ul className="mt-5 space-y-2">
                      {section.bullets.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm">
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-mkt-navy/60" aria-hidden />
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {section.id === "change-requests" || section.id === "retention" ? (
                    <Link
                      href={`/blog/${section.id === "change-requests" ? "reduce-change-request-chaos" : "client-health-scores-explained"}`}
                      className="mt-5 inline-block text-sm font-semibold text-mkt-navy underline-offset-2 hover:underline"
                    >
                      Read the guide →
                    </Link>
                  ) : null}
                </ColorBlockCard>
              </section>
            </ScrollReveal>
          ))}
        </div>
      </MarketingPageBody>
      <MarketingCta description="Sign in to manage companies, projects, and change requests in your organization." />
    </>
  );
}
