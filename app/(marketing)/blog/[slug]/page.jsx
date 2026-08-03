import { notFound } from "next/navigation";

import { BlogPostBody } from "@/app/components/marketing/blog-post-body";
import { MarketingBreadcrumb } from "@/app/components/marketing/marketing-page-shell";
import { MarketingCta } from "@/app/components/marketing/marketing-page-shell";
import { articleJsonLd, breadcrumbJsonLd, JsonLd } from "@/app/components/marketing/json-ld";
import { blogPosts, getBlogPost } from "@/app/lib/marketing/content";
import { createPageMetadata } from "@/app/lib/marketing/seo";
import { metadataBase } from "@/app/lib/marketing/site";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Guide not found" };

  return createPageMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${slug}`,
    type: "article",
    publishedTime: post.datePublished,
    modifiedTime: post.dateModified,
    authors: [post.author],
    keywords: post.keywords,
  });
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const url = `${metadataBase}/blog/${slug}`;

  return (
    <>
      <JsonLd
        data={articleJsonLd({
          headline: post.title,
          datePublished: post.datePublished,
          dateModified: post.dateModified,
          author: post.author,
          url,
          description: post.description,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: metadataBase },
          { name: "Guides", url: `${metadataBase}/blog` },
          { name: post.title, url },
        ])}
      />

      <BlogPostBody
        post={post}
        breadcrumb={
          <MarketingBreadcrumb
            items={[
              { href: "/", label: "Home" },
              { href: "/blog", label: "Guides" },
              { href: `/blog/${slug}`, label: post.title },
            ]}
          />
        }
      />

      <MarketingCta title="Use these features in Meridian" />
    </>
  );
}
