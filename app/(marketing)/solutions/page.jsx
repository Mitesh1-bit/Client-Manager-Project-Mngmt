import Link from "next/link";

import { AudienceTabs } from "@/app/components/marketing/audience-tabs";
import { ColorBlockCard } from "@/app/components/marketing/color-block-card";
import {
  MarketingBreadcrumb,
  MarketingCta,
  MarketingPageBody,
  MarketingPageHeader,
  MarketingSectionIntro,
} from "@/app/components/marketing/marketing-page-shell";
import { ScrollReveal } from "@/app/components/marketing/scroll-reveal";
import { solutionRoles } from "@/app/lib/marketing/site";

export const metadata = {
  title: "Solutions",
  description:
    "How account managers, project managers, agency leadership, and client partners use Meridian.",
  alternates: { canonical: "/solutions" },
};

export default function SolutionsPage() {
  return (
    <>
      <MarketingPageHeader
        title="Solutions by role"
        description="Each role works from the same company and project records — with permissions matched to internal or portal access."
        breadcrumb={
          <MarketingBreadcrumb
            items={[
              { href: "/", label: "Home" },
              { href: "/solutions", label: "Solutions" },
            ]}
          />
        }
      />
      <MarketingPageBody>
        <MarketingSectionIntro
          title="Choose your role"
          description="Select a role to see how Meridian supports that workflow. Links in the nav jump directly to each role."
        />
        <ScrollReveal>
          <AudienceTabs tabs={solutionRoles} />
        </ScrollReveal>

        <ScrollReveal className="mt-16">
          <ColorBlockCard tone="sun">
            <h2 className="font-mkt-display text-2xl">What Meridian replaces</h2>
            <p className="mt-4 max-w-3xl leading-relaxed">
              Spreadsheets for account health, email threads for scope changes, and portal tools that
              don&apos;t connect to project data. Meridian keeps delivery and retention on one
              platform your team and clients can both use.
            </p>
            <Link href="/product" className="mt-5 inline-block text-sm font-semibold text-mkt-navy hover:underline">
              See product modules →
            </Link>
          </ColorBlockCard>
        </ScrollReveal>
      </MarketingPageBody>
      <MarketingCta description="Internal users access the dashboard; client partners use the portal." />
    </>
  );
}
