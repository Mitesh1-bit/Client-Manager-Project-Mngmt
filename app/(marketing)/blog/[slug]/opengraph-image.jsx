import { notFound } from "next/navigation";

import { renderOgImage, ogImageContentType, ogImageSize } from "@/app/lib/marketing/og-image";
import { getBlogPost } from "@/app/lib/marketing/content";

export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image({ params }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  return renderOgImage({
    title: post.title,
    subtitle: post.description,
    eyebrow: "Guide",
  });
}

export async function generateStaticParams() {
  const { blogPosts } = await import("@/app/lib/marketing/content");
  return blogPosts.map((post) => ({ slug: post.slug }));
}
