import { redirect } from "next/navigation";

import { asArray } from "@/app/lib/api/safe-list";
import { getSessionClaims } from "@/app/lib/auth/session";
import { getClient } from "@/app/lib/graphql/apollo-client";
import {
  ProjectDetailHeaderDocument,
  ProjectDocumentsDocument,
} from "@/app/lib/graphql/generated/documents";

import { ProjectDocumentsPanel } from "./project-documents-panel";

export const metadata = { title: "Documents" };

export default async function ProjectDocumentsPage({ params }) {
  const { id } = await params;

  const [claims, { data: header }, { data }] = await Promise.all([
    getSessionClaims(),
    getClient().query({ query: ProjectDetailHeaderDocument, variables: { id } }),
    getClient().query({ query: ProjectDocumentsDocument, variables: { projectId: id } }),
  ]);

  if (!header.project?.canManage) redirect(`/projects/${id}`);

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
