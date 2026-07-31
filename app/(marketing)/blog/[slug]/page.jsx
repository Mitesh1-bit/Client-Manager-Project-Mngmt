import Link from "next/link";
import { notFound } from "next/navigation";

import { articleJsonLd, breadcrumbJsonLd, JsonLd } from "@/app/components/marketing/json-ld";
import {
  MarketingBreadcrumb,
  MarketingCta,
  MarketingPageBody,
  MarketingPageHeader,
} from "@/app/components/marketing/marketing-page-shell";
import { blogPosts, getBlogPost } from "@/app/lib/marketing/content";
import { metadataBase } from "@/app/lib/marketing/site";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Guide not found" };

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: "article",
      publishedTime: post.datePublished,
      modifiedTime: post.dateModified,
      authors: [post.author],
    },
  };
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

      <MarketingPageHeader
        title={post.title}
        description={post.description}
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

      <MarketingPageBody className="max-w-3xl">
        <aside className="rounded-xl border border-mkt-sun bg-mkt-sun/30 p-4">
          <p className="text-xs font-bold tracking-widest text-mkt-navy/70 uppercase">Summary</p>
          <p className="mt-2 font-medium text-mkt-navy">{post.directAnswer}</p>
        </aside>

        <div className="prose-marketing mt-10">
          {post.body.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-4 border-t border-mkt-navy/10 pt-8">
          <Link href="/blog" className="text-sm font-semibold text-mkt-cta hover:underline">
            ← All guides
          </Link>
          <Link href="/product" className="text-sm font-semibold text-mkt-navy hover:text-mkt-cta hover:underline">
            Product overview →
          </Link>
        </div>
      </MarketingPageBody>

      <MarketingCta title="Use these features in Meridian" />
    </>
  );
}
