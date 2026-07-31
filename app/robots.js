import { metadataBase } from "@/app/lib/marketing/site";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/companies/", "/projects/", "/retention/", "/portal/", "/api/"],
    },
    sitemap: `${metadataBase}/sitemap.xml`,
    host: metadataBase,
  };
}
