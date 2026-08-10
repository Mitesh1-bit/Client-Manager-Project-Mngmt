"use client";

import Link from "next/link";
import { FileText } from "lucide-react";

import { DocumentEmbedPanel } from "@/app/components/domain/documents/document-embed-panel";
import { Button } from "@/app/components/ui/button";
import { normalizeDocumentRecords } from "@/app/lib/documents/normalize";

import { PortalCard, PortalSectionHeader } from "./portal-ui";

/**
 * @param {{ documents: object[]; maxItems?: number }} props
 */
export function PortalRecentDocumentsPanel({ documents, maxItems = 5 }) {
  const normalized = normalizeDocumentRecords(documents);
  if (normalized.length === 0) return null;

  return (
    <PortalCard>
      <PortalSectionHeader
        id="portal-recent-documents"
        title="Recent files"
        action={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/portal/documents">View all</Link>
          </Button>
        }
      />
      <DocumentEmbedPanel documents={normalized} maxItems={maxItems} viewAllHref="/portal/documents" />
    </PortalCard>
  );
}

/**
 * @param {{ count: number }} props
 */
export function PortalDocumentsStatHint({ count }) {
  if (count <= 0) return "Shared deliverables and contracts";
  return count === 1 ? "1 file shared with you" : `${count} files shared with you`;
}

export { FileText as PortalDocumentsIcon };
