"use client";

import { DocumentListPanel } from "@/app/components/domain/documents/document-list-panel";

/**
 * @param {{ documents: object[]; viewerId?: string }} props
 */
export function PortalProjectFilesPanel({ documents, viewerId }) {
  if (documents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nothing shared yet. Deliverables will show up here as we finish them.
      </p>
    );
  }

  return (
    <DocumentListPanel
      documents={documents}
      viewerId={viewerId}
      managerRoles={[]}
      compact
      hideToolbar
      emptyDescription="Nothing shared yet."
    />
  );
}
