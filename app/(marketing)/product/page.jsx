import { ProductMarketingPage } from "@/app/components/marketing/product-marketing-page";
import { createPageMetadata } from "@/app/lib/marketing/seo";

export const metadata = createPageMetadata({
  title: "Product",
  description:
    "Explore Meridian — companies, projects, change requests, client portal, and retention modules built for agency client delivery.",
  path: "/product",
  keywords: [
    "agency delivery platform",
    "project management for agencies",
    "client portal software",
    "change request workflow",
  ],
});

export default function ProductPage() {
  return <ProductMarketingPage />;
}
