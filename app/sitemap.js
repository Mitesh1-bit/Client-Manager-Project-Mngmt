import { blogPosts } from "@/app/lib/marketing/content";
import { metadataBase } from "@/app/lib/marketing/site";

export default function sitemap() {
  const staticRoutes = ["", "/product", "/solutions", "/blog", "/privacy", "/terms"].map((path) => ({
    url: `${metadataBase}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.8,
  }));

  const blogRoutes = blogPosts.map((post) => ({
    url: `${metadataBase}/blog/${post.slug}`,
    lastModified: post.dateModified,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...blogRoutes];
}
