import { notFound } from "next/navigation";
import { Download, FileText } from "lucide-react";

import { EmptyState } from "@/app/components/domain/states";
import { Button } from "@/app/components/ui/button";
import { formatBytes, formatDate } from "@/app/lib/format";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { CompanyDocumentsDocument } from "@/app/lib/graphql/generated/documents";

export const metadata = { title: "Documents" };

export default async function CompanyDocsPage({ params }) {
  const { id } = await params;
  const { data } = await getClient().query({
    query: CompanyDocumentsDocument,
    variables: { id },
  });

  if (!data.company) notFound();
  const documents = data.company.documents;

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No documents yet"
        description="Contracts, briefs and deliverables attached to this company will be listed here. Uploading arrives with the documents module."
      />
    );
  }

  return (
    <ul className="divide-y rounded-xl border bg-card">
      {documents.map((document) => (
        <li key={document.id} className="flex items-center gap-4 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <FileText aria-hidden="true" className="size-4.5" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{document.name}</p>
            <p className="mt-0.5 text-caption text-muted-foreground">
              Version {document.version} · {formatBytes(document.sizeBytes)} ·{" "}
              {document.uploadedByName ?? "Unknown"} · {formatDate(document.createdAt)}
            </p>
          </div>

          <Button variant="outline" size="sm" asChild>
            <a href={document.fileUrl} download>
              <Download aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Download</span>
              <span className="sr-only"> {document.name}</span>
            </a>
          </Button>
        </li>
      ))}
    </ul>
  );
}
