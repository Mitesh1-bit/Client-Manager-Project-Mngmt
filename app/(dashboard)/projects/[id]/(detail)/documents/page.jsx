import { FileText } from "lucide-react";

import { EmptyState } from "@/app/components/domain/states";
import { asArray } from "@/app/lib/api/safe-list";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { ProjectDocumentsDocument } from "@/app/lib/graphql/generated/documents";

import { DocumentUpload } from "./document-upload";

export const metadata = { title: "Documents" };

export default async function ProjectDocumentsPage({ params }) {
  const { id } = await params;
  const { data } = await getClient().query({
    query: ProjectDocumentsDocument,
    variables: { projectId: id },
  });
  const documents = asArray(data.documents);

  return (
    <div data-tour="project-documents" className="space-y-4">
      <div className="toolbar-row">
        <p className="text-caption text-muted-foreground">{documents.length} file{documents.length === 1 ? "" : "s"}</p>
        <DocumentUpload projectId={id} />
      </div>

      {documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Upload a file, or the client can upload one from their portal — either way it shows up here."
        />
      ) : (
        <ul className="space-y-2">
          {documents.map((document) => (
            <li key={document.id}>
              <a
                href={`/api/backend/assets/download?path=${encodeURIComponent(document.fileUrl)}`}
                className="flex items-center gap-3 rounded-2xl border bg-card p-3.5 transition-shadow hover:shadow-card focus-ring"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <FileText aria-hidden="true" className="size-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {document.fileUrl.split("/").pop()}
                  </span>
                  <span className="block truncate text-caption text-muted-foreground">
                    v{document.version}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
