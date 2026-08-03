import { LegalDocumentPage } from "@/app/components/marketing/legal-marketing-page";
import { breadcrumbJsonLd, JsonLd, webPageJsonLd } from "@/app/components/marketing/json-ld";
import { LEGAL_LAST_UPDATED, termsOfServiceDocument } from "@/app/lib/marketing/legal-content";
import { createPageMetadata } from "@/app/lib/marketing/seo";
import { metadataBase } from "@/app/lib/marketing/site";

export const metadata = createPageMetadata({
  title: termsOfServiceDocument.metadataTitle,
  description: termsOfServiceDocument.description,
  path: termsOfServiceDocument.path,
  keywords: termsOfServiceDocument.keywords,
});

export default function TermsPage() {
  const url = `${metadataBase}${termsOfServiceDocument.path}`;

  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          name: termsOfServiceDocument.title,
          url,
          description: termsOfServiceDocument.description,
          dateModified: LEGAL_LAST_UPDATED,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: metadataBase },
          { name: "Terms of service", url },
        ])}
      />
      <LegalDocumentPage
        document={termsOfServiceDocument}
        tone="lime"
        breadcrumbItems={[
          { href: "/", label: "Home" },
          { href: termsOfServiceDocument.path, label: "Terms" },
        ]}
        related={{
          href: "/privacy",
          label: "Privacy policy",
          description: "How Meridian handles personal and client data.",
        }}
      />
    </>
  );
}
