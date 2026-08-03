import { MarketingHomePage } from "@/app/components/marketing/marketing-home-page";
import { createPageMetadata } from "@/app/lib/marketing/seo";
import { SITE_DESCRIPTION, SITE_NAME } from "@/app/lib/marketing/site";

export const metadata = createPageMetadata({
  title: `${SITE_NAME} — Client & project management for agencies`,
  description: SITE_DESCRIPTION,
  path: "/",
  absoluteTitle: true,
  keywords: [
    "agency project management",
    "client portal",
    "change requests",
    "client health score",
    "agency CRM",
  ],
});

export default function MarketingHomeRoute() {
  return <MarketingHomePage />;
}
