import { notFound } from "next/navigation";
import { Download, FileText, Lock } from "lucide-react";

import { EmptyState } from "@/app/components/domain/states";
import { Button } from "@/app/components/ui/button";
import { asArray } from "@/app/lib/api/safe-list";
import { formatGraphqlError } from "@/app/lib/graphql/format-error";
import { getClient } from "@/app/lib/graphql/apollo-client";
import {
  CompanyDetailHeaderDocument,
  CompanyDocumentsDocument,
} from "@/app/lib/graphql/generated/documents";

export const metadata = { title: "Documents" };

export default async function CompanyDocsPage({ params }) {
  const { id } = await params;
  const [{ data: header }, docsResult] = await Promise.all([
    getClient().query({ query: CompanyDetailHeaderDocument, variables: { id } }),
    getClient()
      .query({ query: CompanyDocumentsDocument, variables: { companyId: id } })
      .then(({ data }) => ({ data, error: null }))
      .catch((error) => ({ data: null, error })),
  ]);

  if (!header.company) notFound();

  // Documents are finance/ops-sensitive — the backend restricts who can see
  // them (see the tab-visibility check in the layout). Someone reaching this
  // URL directly without that role gets a plain explanation, not a page crash.
  if (docsResult.error) {
    return (
      <EmptyState
        icon={Lock}
        title="You don't have access to documents"
        description={formatGraphqlError(docsResult.error, "Ask an admin or project manager for access.")}
      />
    );
  }

  const documents = asArray(docsResult.data.companyDocuments);

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No documents yet"
        description="Contracts, briefs and deliverables attached to this client will be listed here."
      />
    );
  }

  return (
    <ul data-tour="company-documents" className="divide-y rounded-xl border bg-card">
      {documents.map((document) => (
        <li key={document.id} className="flex items-center gap-4 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <FileText aria-hidden="true" className="size-4.5" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{document.fileUrl.split("/").pop()}</p>
            <p className="mt-0.5 text-caption text-muted-foreground">
              Version {document.version}
            </p>
          </div>

          <Button variant="outline" size="sm" asChild>
            <a href={`/api/backend/assets/download?path=${encodeURIComponent(document.fileUrl)}`}>
              <Download aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Download</span>
            </a>
          </Button>
        </li>
      ))}
    </ul>
  );
}
