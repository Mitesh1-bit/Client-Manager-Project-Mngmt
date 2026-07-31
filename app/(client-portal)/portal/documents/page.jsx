import { FileText } from "lucide-react";

import { PageHeader } from "@/app/components/domain/page-header";
import { EmptyState } from "@/app/components/domain/states";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { PortalDocumentsDocument } from "@/app/lib/graphql/generated/documents";
import { requireViewer } from "@/app/lib/graphql/viewer";

export const metadata = { title: "Documents" };

export default async function PortalDocumentsPage() {
  await requireViewer("PORTAL");
  const { data } = await getClient().query({ query: PortalDocumentsDocument });
  const documents = data.portalDocuments ?? [];

  return (
    <>
      <PageHeader
        title="Documents"
        description="Deliverables, contracts and anything else we've shared with you."
      />

      {documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nothing here yet"
          description="Contracts and deliverables will appear here as we share them."
        />
      ) : (
        <ul className="space-y-2">
          {documents.map((document) => (
            <li key={document.id}>
              <a
                href={document.fileUrl}
                download
                className="flex items-center gap-3 rounded-2xl border bg-card p-3.5 transition-shadow hover:shadow-card focus-ring"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <FileText aria-hidden="true" className="size-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{document.fileUrl.split("/").pop()}</span>
                  <span className="block truncate text-caption text-muted-foreground">
                    v{document.version} · {document.entityType}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
