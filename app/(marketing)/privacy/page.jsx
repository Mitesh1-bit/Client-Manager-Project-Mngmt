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
  title: "Privacy policy",
  description: "Meridian privacy policy.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <MarketingPageHeader
        title="Privacy policy"
        description="Last updated: July 2026"
        breadcrumb={
          <MarketingBreadcrumb
            items={[
              { href: "/", label: "Home" },
              { href: "/privacy", label: "Privacy" },
            ]}
          />
        }
      />
      <MarketingPageBody className="max-w-3xl">
        <ScrollReveal>
          <ColorBlockCard tone="sky" className="prose-marketing !max-w-none">
            <p>
              Meridian provides client and project management software for agencies. This policy
              describes how we handle personal data when you use our website and application.
            </p>
            <h2>Data we collect</h2>
            <p>
              Account information (name, email, organization), usage logs, and client data you enter
              into the platform. We do not sell personal data.
            </p>
            <h2>How we use data</h2>
            <p>
              To provide the service, improve reliability, send product communications you opt into,
              and meet legal obligations.
            </p>
            <h2>Your account</h2>
            <p>
              You can sign in to manage your organization data. Contact your organization admin for
              account access questions.
            </p>
          </ColorBlockCard>
        </ScrollReveal>
        <p className="mt-8 text-sm text-mkt-navy/70">
          <Link href="/terms" className="font-semibold text-mkt-cta hover:underline">
            Terms of service
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
