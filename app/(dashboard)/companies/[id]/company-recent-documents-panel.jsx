"use client";

import Link from "next/link";

import { DocumentEmbedPanel } from "@/app/components/domain/documents/document-embed-panel";
import { Button } from "@/app/components/ui/button";
import { SectionCard } from "@/app/components/domain/states";

/**
 * @param {{ companyId: string; documents: object[]; maxItems?: number }} props
 */
export function CompanyRecentDocumentsPanel({ companyId, documents, maxItems = 5 }) {
  if (!documents?.length) return null;

  return (
    <SectionCard
      title="Recent documents"
      description="Latest files across this client's projects."
      actions={
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/companies/${companyId}/docs`}>View all</Link>
        </Button>
      }
    >
      <DocumentEmbedPanel
        documents={documents}
        maxItems={maxItems}
        viewAllHref={`/companies/${companyId}/docs`}
      />
    </SectionCard>
  );
}
