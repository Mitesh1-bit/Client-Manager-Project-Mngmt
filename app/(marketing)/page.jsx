import { MarketingHomePage } from "@/app/components/marketing/marketing-home-page";
import { SITE_DESCRIPTION, SITE_NAME } from "@/app/lib/marketing/site";

export const metadata = {
  title: `${SITE_NAME} — Client & project management for agencies`,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

export default function MarketingHomeRoute() {
  return <MarketingHomePage />;
}
