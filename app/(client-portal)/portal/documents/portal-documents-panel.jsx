"use client";

import { DocumentListPanel } from "@/app/components/domain/documents/document-list-panel";
import { DocumentUploadZone } from "@/app/components/domain/documents/document-upload-zone";
import { ConfirmUploadDocument, RequestUploadUrlDocument } from "@/app/lib/graphql/generated/documents";

/**
 * @param {{
 *   documents: object[];
 *   projects: { id: string; name: string }[];
 *   viewerId?: string;
 * }} props
 */
export function PortalDocumentsPanel({ documents, projects, viewerId }) {
  return (
    <div className="space-y-6">
      {projects.length > 0 ? (
        <DocumentUploadZone
          entityId={projects[0]?.id}
          entityType="project"
        requestUploadMutation={RequestUploadUrlDocument}
        confirmUploadMutation={ConfirmUploadDocument}
        projectOptions={projects}
        includeEntityType
        label="Share a file with your project team"
        />
      ) : null}
      <DocumentListPanel
        documents={documents}
        viewerId={viewerId}
        viewerRole={undefined}
        managerRoles={[]}
        emptyDescription="When deliverables or contracts are ready, they'll appear here."
      />
    </div>
  );
}
