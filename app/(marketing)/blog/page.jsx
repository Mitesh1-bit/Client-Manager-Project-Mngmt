import {
  MarketingBreadcrumb,
  MarketingCta,
  MarketingGuideCard,
  MarketingPageBody,
  MarketingPageHeader,
  MarketingSectionIntro,
} from "@/app/components/marketing/marketing-page-shell";
import { blogPosts } from "@/app/lib/marketing/content";

export const metadata = {
  title: "Guides",
  description:
    "Product guides for Meridian — change requests, client health scores, and agency delivery workflows.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  return (
    <>
      <MarketingPageHeader
        title="Guides"
        description="Short guides explaining how Meridian features work — based on the shipped product."
        breadcrumb={
          <MarketingBreadcrumb
            items={[
              { href: "/", label: "Home" },
              { href: "/blog", label: "Guides" },
            ]}
          />
        }
      />
      <MarketingPageBody>
        <MarketingSectionIntro
          title="Product guides"
          description="Learn how change requests and health scores work before you sign in."
        />
        <ul className="grid gap-6 md:grid-cols-2">
          {blogPosts.map((post) => (
            <li key={post.slug}>
              <MarketingGuideCard
                href={`/blog/${post.slug}`}
                date={post.datePublished}
                title={post.title}
                description={post.description}
              />
            </li>
          ))}
        </ul>
      </MarketingPageBody>
      <MarketingCta
        title="Try these features in the app"
        description="Create an account to run change requests, health scoring, and retention in your organization."
      />
    </>
  );
}
