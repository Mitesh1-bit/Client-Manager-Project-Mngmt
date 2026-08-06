import { Suspense } from "react";
import { FileText } from "lucide-react";

import { ListToolbar } from "@/app/components/domain/list-toolbar";
import { PaginationBar } from "@/app/components/domain/pagination-bar";
import { filterList, paginateList } from "@/app/lib/api/connection";
import { portalDocumentName } from "@/app/lib/api/portal-ui";
import { getClient } from "@/app/lib/graphql/apollo-client";
import {
  PortalDocumentsDocument,
  PortalProjectsDocument,
} from "@/app/lib/graphql/generated/documents";
import { requireViewer } from "@/app/lib/graphql/viewer";
import { parseListParams, readString } from "@/app/lib/list-params";

import {
  PortalCard,
  PortalEmptyPanel,
  PortalPageHeader,
  PortalSectionHeader,
} from "../portal-ui";
import { DocumentUpload } from "./document-upload";
import { PortalDocumentRow } from "./portal-document-row";

export const metadata = { title: "Documents" };

export default async function PortalDocumentsPage({ searchParams }) {
  const viewer = await requireViewer("PORTAL");
  const params = await searchParams;
  const query = readString(params, "q");
  const { pageInput } = parseListParams(params, { sortable: [], pageSize: 15 });

  const [{ data }, { data: projectsData }] = await Promise.all([
    getClient().query({ query: PortalDocumentsDocument }),
    getClient().query({ query: PortalProjectsDocument }),
  ]);
  const documents = (data.portalDocuments ?? []).map((document) => ({
    ...document,
    displayName: portalDocumentName(document.fileUrl),
  }));
  const projects = projectsData.portalProjects ?? [];

  const filtered = filterList(documents, {
    query,
    searchFields: ["displayName", "entityType"],
  });
  const { nodes, pageInfo, totalCount } = paginateList(filtered, pageInput);

  return (
    <>
      <PortalPageHeader
        eyebrow="Shared files"
        title="Documents"
        description="Contracts, deliverables, and files your agency has shared with you."
      />

      {projects.length > 0 ? (
        <PortalCard className="mb-6">
          <PortalSectionHeader
            title="Upload a file"
            description="Share a brief, asset, or reference with your project team."
          />
          <DocumentUpload projects={projects} />
        </PortalCard>
      ) : null}

      {documents.length === 0 ? (
        <PortalEmptyPanel>
          <FileText aria-hidden="true" className="mx-auto size-10 text-muted-foreground/50" />
          <h2 className="mt-4 text-lg font-semibold text-[#0a1550]">Nothing here yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            When deliverables or contracts are ready, they&apos;ll appear here for download.
          </p>
        </PortalEmptyPanel>
      ) : (
        <>
          <div className="mb-5">
            <Suspense fallback={null}>
              <ListToolbar
                searchPlaceholder="Search documents…"
                searchLabel="Search documents"
                filters={[]}
              />
            </Suspense>
          </div>

          {nodes.length === 0 ? (
            <PortalEmptyPanel>
              <p className="text-sm text-muted-foreground">No documents match your search.</p>
            </PortalEmptyPanel>
          ) : (
            <ul className="space-y-2">
              {nodes.map((document) => (
                <PortalDocumentRow key={document.id} document={document} viewerId={viewer.id} />
              ))}
            </ul>
          )}

          <Suspense fallback={null}>
            <PaginationBar pageInfo={pageInfo} totalCount={totalCount} itemLabel="documents" />
          </Suspense>
        </>
      )}
    </>
  );
}
