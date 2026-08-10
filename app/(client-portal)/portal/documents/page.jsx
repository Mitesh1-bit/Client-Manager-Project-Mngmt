import { getClient } from "@/app/lib/graphql/apollo-client";
import { PortalDocumentsDocument, PortalProjectsDocument } from "@/app/lib/graphql/generated/documents";
import { requireViewer } from "@/app/lib/graphql/viewer";

import { PortalPageHeader } from "../portal-ui";
import { PortalDocumentsPanel } from "./portal-documents-panel";

export const metadata = { title: "Documents" };

export default async function PortalDocumentsPage() {
  const viewer = await requireViewer("PORTAL");

  const [{ data }, { data: projectsData }] = await Promise.all([
    getClient().query({ query: PortalDocumentsDocument }),
    getClient().query({ query: PortalProjectsDocument }),
  ]);

  return (
    <>
      <PortalPageHeader
        eyebrow="Shared files"
        title="Documents"
        description="Contracts, deliverables, and files your agency has shared with you."
      />
      <PortalDocumentsPanel
        documents={data.portalDocuments ?? []}
        projects={projectsData.portalProjects ?? []}
        viewerId={viewer.id}
      />
    </>
  );
}
