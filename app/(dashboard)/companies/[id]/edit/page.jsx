import { notFound, redirect } from "next/navigation";

import { BackLink } from "@/app/components/domain/back-link";
import { PageHeader } from "@/app/components/domain/page-header";
import { normalizeCompany } from "@/app/lib/api/normalize";
import { getSessionClaims } from "@/app/lib/auth/session";
import { getClient } from "@/app/lib/graphql/apollo-client";
import {
  CompanyForEditDocument,
  CompanyFormOptionsDocument,
} from "@/app/lib/graphql/generated/documents";
import { canManageClients } from "@/app/lib/rbac";

import { CompanyForm } from "../../company-form";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const { data } = await getClient().query({
    query: CompanyForEditDocument,
    variables: { id },
  });
  return { title: data.company ? `Edit ${data.company.name}` : "Edit client" };
}

export default async function EditCompanyPage({ params }) {
  const { id } = await params;

  const claims = await getSessionClaims();
  if (!canManageClients(claims?.role)) redirect(`/companies/${id}`);

  const [{ data }, { data: options }] = await Promise.all([
    getClient().query({ query: CompanyForEditDocument, variables: { id } }),
    getClient().query({ query: CompanyFormOptionsDocument }),
  ]);

  if (!data.company) notFound();

  const company = normalizeCompany(data.company);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <BackLink href={`/companies/${id}`}>Back to {company.name}</BackLink>

      <PageHeader title={`Edit ${company.name}`} />

      <CompanyForm
        key={company.id}
        mode="edit"
        company={company}
        owners={options?.users ?? []}
        tags={options?.tags ?? []}
        sizes={options?.companySizes ?? []}
        industries={options?.industries ?? []}
      />
    </div>
  );
}
