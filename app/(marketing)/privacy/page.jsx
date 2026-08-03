import { LegalDocumentPage } from "@/app/components/marketing/legal-marketing-page";
import { breadcrumbJsonLd, JsonLd, webPageJsonLd } from "@/app/components/marketing/json-ld";
import { LEGAL_LAST_UPDATED, privacyPolicyDocument } from "@/app/lib/marketing/legal-content";
import { createPageMetadata } from "@/app/lib/marketing/seo";
import { metadataBase } from "@/app/lib/marketing/site";

export const metadata = createPageMetadata({
  title: privacyPolicyDocument.metadataTitle,
  description: privacyPolicyDocument.description,
  path: privacyPolicyDocument.path,
  keywords: privacyPolicyDocument.keywords,
});

export default function PrivacyPage() {
  const url = `${metadataBase}${privacyPolicyDocument.path}`;

  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          name: privacyPolicyDocument.title,
          url,
          description: privacyPolicyDocument.description,
          dateModified: LEGAL_LAST_UPDATED,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: metadataBase },
          { name: "Privacy policy", url },
        ])}
      />
      <LegalDocumentPage
        document={privacyPolicyDocument}
        tone="sky"
        breadcrumbItems={[
          { href: "/", label: "Home" },
          { href: privacyPolicyDocument.path, label: "Privacy" },
        ]}
        related={{
          href: "/terms",
          label: "Terms of service",
          description: "Rules for using Meridian and the client portal.",
        }}
      />
    </>
  );
}
