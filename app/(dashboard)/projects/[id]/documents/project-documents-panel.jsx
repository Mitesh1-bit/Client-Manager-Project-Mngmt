"use client";

import { DocumentListPanel } from "@/app/components/domain/documents/document-list-panel";
import { DocumentUploadZone } from "@/app/components/domain/documents/document-upload-zone";
import {
  ConfirmProjectUploadDocument,
  RequestProjectUploadUrlDocument,
} from "@/app/lib/graphql/generated/documents";

/**
 * @param {{ projectId: string; documents: object[]; viewerId?: string; viewerRole?: string }} props
 */
export function ProjectDocumentsPanel({ projectId, documents, viewerId, viewerRole }) {
  return (
    <div className="space-y-4">
      <DocumentUploadZone
        entityId={projectId}
        entityType="project"
        requestUploadMutation={RequestProjectUploadUrlDocument}
        confirmUploadMutation={ConfirmProjectUploadDocument}
        label="Upload project files"
      />
      <DocumentListPanel
        documents={documents}
        viewerId={viewerId}
        viewerRole={viewerRole}
        emptyDescription="Upload a file, or the client can upload one from their portal — either way it shows up here."
      />
    </div>
  );
}
