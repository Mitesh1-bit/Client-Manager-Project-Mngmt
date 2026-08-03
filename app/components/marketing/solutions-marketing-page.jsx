"use client";

import { SolutionsBeforeAfter } from "@/app/components/marketing/solutions-before-after";
import { SolutionsChaosCompare } from "@/app/components/marketing/solutions-chaos-compare";
import { SolutionsEditorialHero } from "@/app/components/marketing/solutions-editorial-hero";
import { SolutionsPlayStrip, SolutionsTinkerCta } from "@/app/components/marketing/solutions-play-strip";
import { SolutionsRoleStack } from "@/app/components/marketing/solutions-role-stack";
import { SolutionsRoleStudio } from "@/app/components/marketing/solutions-role-studio";
import { speedComparisonContent } from "@/app/lib/marketing/site";

export function SolutionsMarketingPage() {
  return (
    <>
      <SolutionsEditorialHero />
      <SolutionsRoleStudio />
      <SolutionsRoleStack />
      <SolutionsBeforeAfter />
      <SolutionsChaosCompare {...speedComparisonContent} />
      <SolutionsPlayStrip />
      <SolutionsTinkerCta />
    </>
  );
}
