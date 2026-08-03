import { BlogMarketingPage } from "@/app/components/marketing/blog-marketing-page";
import { blogPosts } from "@/app/lib/marketing/content";
import { createPageMetadata } from "@/app/lib/marketing/seo";

export const metadata = createPageMetadata({
  title: "Guides",
  description:
    "Meridian product guides for agencies — structured change requests, client health scores, and delivery workflows.",
  path: "/blog",
  keywords: ["agency guides", "change request guide", "client health score", "project delivery"],
});

export default function BlogIndexPage() {
  return <BlogMarketingPage posts={blogPosts} />;
}
