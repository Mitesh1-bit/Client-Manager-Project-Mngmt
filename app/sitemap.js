import { blogPosts } from "@/app/lib/marketing/content";
import { metadataBase } from "@/app/lib/marketing/site";

export const dynamic = "force-static";

export default function sitemap() {
  const staticRoutes = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/product", priority: 0.9, changeFrequency: "monthly" },
    { path: "/solutions", priority: 0.9, changeFrequency: "monthly" },
    { path: "/blog", priority: 0.8, changeFrequency: "weekly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  ].map(({ path, priority, changeFrequency }) => ({
    url: `${metadataBase}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));

  const blogRoutes = blogPosts.map((post) => ({
    url: `${metadataBase}/blog/${post.slug}`,
    lastModified: post.dateModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...blogRoutes];
}
