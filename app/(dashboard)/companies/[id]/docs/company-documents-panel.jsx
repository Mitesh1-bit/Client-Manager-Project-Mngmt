"use client";

import { DocumentListPanel } from "@/app/components/domain/documents/document-list-panel";

/**
 * @param {{ documents: object[]; viewerId?: string; viewerRole?: string }} props
 */
export function CompanyDocumentsPanel({ documents, viewerId, viewerRole }) {
  return (
    <DocumentListPanel
      documents={documents}
      viewerId={viewerId}
      viewerRole={viewerRole}
      emptyDescription="Contracts, briefs and deliverables attached to this client's projects will appear here."
    />
  );
}
