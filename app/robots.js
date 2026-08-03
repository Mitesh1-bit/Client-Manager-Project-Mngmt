import { metadataBase } from "@/app/lib/marketing/site";

export const dynamic = "force-static";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/dashboard/",
          "/companies",
          "/companies/",
          "/projects",
          "/projects/",
          "/change-requests",
          "/change-requests/",
          "/retention",
          "/retention/",
          "/settings",
          "/search",
          "/portal",
          "/portal/",
          "/api/",
        ],
      },
    ],
    sitemap: `${metadataBase}/sitemap.xml`,
    host: metadataBase,
  };
}
