import { SolutionsMarketingPage } from "@/app/components/marketing/solutions-marketing-page";
import { createPageMetadata } from "@/app/lib/marketing/seo";

export const metadata = createPageMetadata({
  title: "Solutions",
  description:
    "See how account managers, project managers, agency leadership, and client partners use Meridian for delivery, approvals, and retention.",
  path: "/solutions",
  keywords: [
    "agency account management",
    "project manager workflow",
    "client approval portal",
    "agency leadership dashboard",
  ],
});

export default function SolutionsPage() {
  return <SolutionsMarketingPage />;
}
