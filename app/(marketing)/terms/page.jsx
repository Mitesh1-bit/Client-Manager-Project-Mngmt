import Link from "next/link";

import { ColorBlockCard } from "@/app/components/marketing/color-block-card";
import {
  MarketingBreadcrumb,
  MarketingCta,
  MarketingPageBody,
  MarketingPageHeader,
} from "@/app/components/marketing/marketing-page-shell";
import { ScrollReveal } from "@/app/components/marketing/scroll-reveal";

export const metadata = {
  title: "Terms of service",
  description: "Meridian terms of service.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <>
      <MarketingPageHeader
        title="Terms of service"
        description="Last updated: July 2026"
        breadcrumb={
          <MarketingBreadcrumb
            items={[
              { href: "/", label: "Home" },
              { href: "/terms", label: "Terms" },
            ]}
          />
        }
      />
      <MarketingPageBody className="max-w-3xl">
        <ScrollReveal>
          <ColorBlockCard tone="lime" className="prose-marketing !max-w-none">
            <p>
              By using Meridian, you agree to these terms. You are responsible for data you upload and
              for ensuring client stakeholders have appropriate consent for portal access.
            </p>
            <h2>Service</h2>
            <p>
              We provide the platform for your organization. Features may evolve; material changes
              will be communicated in advance where required.
            </p>
            <h2>Acceptable use</h2>
            <p>
              Do not misuse the API, attempt unauthorized access, or use the service in violation of
              applicable law.
            </p>
            <h2>Client portal</h2>
            <p>
              Portal users may only access data for their assigned company. Internal users are
              responsible for inviting and managing portal access.
            </p>
          </ColorBlockCard>
        </ScrollReveal>
        <p className="mt-8 text-sm text-mkt-navy/70">
          <Link href="/privacy" className="font-semibold text-mkt-cta hover:underline">
            Privacy policy
          </Link>
          {" · "}
          <Link href="/" className="font-semibold text-mkt-cta hover:underline">
            Back to home
          </Link>
        </p>
      </MarketingPageBody>
      <MarketingCta
        title="Access Meridian"
        description="Sign in to your organization account or create a new one."
        primaryHref="/login"
        primaryLabel="Sign in"
        secondaryHref="/signup"
        secondaryLabel="Create account"
      />
    </>
  );
}
