import { notFound } from "next/navigation";
import { Lock } from "lucide-react";

import { EmptyState } from "@/app/components/domain/states";
import { asArray } from "@/app/lib/api/safe-list";
import { getSessionClaims } from "@/app/lib/auth/session";
import { formatGraphqlError } from "@/app/lib/graphql/format-error";
import { getClient } from "@/app/lib/graphql/apollo-client";
import {
  CompanyDetailHeaderDocument,
  CompanyDocumentsDocument,
} from "@/app/lib/graphql/generated/documents";

import { CompanyDocumentsPanel } from "./company-documents-panel";

export const metadata = { title: "Documents" };

export default async function CompanyDocsPage({ params }) {
  const { id } = await params;
  const claims = await getSessionClaims();

  const [{ data: header }, docsResult] = await Promise.all([
    getClient().query({ query: CompanyDetailHeaderDocument, variables: { id } }),
    getClient()
      .query({ query: CompanyDocumentsDocument, variables: { companyId: id } })
      .then(({ data }) => ({ data, error: null }))
      .catch((error) => ({ data: null, error })),
  ]);

  if (!header.company) notFound();

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

  return (
    <div data-tour="company-documents">
      <CompanyDocumentsPanel documents={documents} viewerId={claims?.sub} viewerRole={claims?.role} />
    </div>
  );
}
