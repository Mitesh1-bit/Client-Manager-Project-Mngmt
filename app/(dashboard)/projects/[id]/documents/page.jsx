import { asArray } from "@/app/lib/api/safe-list";
import { getSessionClaims } from "@/app/lib/auth/session";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { ProjectDocumentsDocument } from "@/app/lib/graphql/generated/documents";

import { DocumentList } from "./document-list";
import { DocumentUpload } from "./document-upload";

export const metadata = { title: "Documents" };

export default async function ProjectDocumentsPage({ params }) {
  const { id } = await params;
  const { data } = await getClient().query({
    query: ProjectDocumentsDocument,
    variables: { projectId: id },
  });
  const documents = asArray(data.documents);
  const claims = await getSessionClaims();

  return (
    <div data-tour="project-documents" className="space-y-4">
      <div className="toolbar-row">
        <p className="text-caption text-muted-foreground">{documents.length} file{documents.length === 1 ? "" : "s"}</p>
        <DocumentUpload projectId={id} />
      </div>

      <DocumentList documents={documents} viewerId={claims?.sub} viewerRole={claims?.role} />
    </div>
  );
}
