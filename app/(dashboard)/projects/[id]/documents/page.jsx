import { redirect } from "next/navigation";

import { asArray } from "@/app/lib/api/safe-list";
import { getSessionClaims } from "@/app/lib/auth/session";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { ProjectDocumentsDocument } from "@/app/lib/graphql/generated/documents";
import { canManageProjects } from "@/app/lib/rbac";

import { ProjectDocumentsPanel } from "./project-documents-panel";

export const metadata = { title: "Documents" };

export default async function ProjectDocumentsPage({ params }) {
  const { id } = await params;

  const claims = await getSessionClaims();
  if (!canManageProjects(claims?.role)) redirect(`/projects/${id}`);

  const { data } = await getClient().query({
    query: ProjectDocumentsDocument,
    variables: { projectId: id },
  });
  const documents = asArray(data.documents);

  return (
    <div data-tour="project-documents" className="space-y-4">
      <p className="text-caption text-muted-foreground">
        {documents.length} file{documents.length === 1 ? "" : "s"}
      </p>
      <ProjectDocumentsPanel
        projectId={id}
        documents={documents}
        viewerId={claims?.sub}
        viewerRole={claims?.role}
      />
    </div>
  );
}
