import { notFound } from "next/navigation";

import { BackLink } from "@/app/components/domain/back-link";
import { PageHeader } from "@/app/components/domain/page-header";
import { getClient } from "@/app/lib/graphql/apollo-client";
import {
  CompanyForEditDocument,
  CompanyFormOptionsDocument,
} from "@/app/lib/graphql/generated/documents";

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

  const [{ data }, { data: options }] = await Promise.all([
    getClient().query({ query: CompanyForEditDocument, variables: { id } }),
    getClient().query({ query: CompanyFormOptionsDocument }),
  ]);

  if (!data.company) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <BackLink href={`/companies/${id}`}>Back to {data.company.name}</BackLink>

      <PageHeader title={`Edit ${data.company.name}`} />

      <CompanyForm
        mode="edit"
        company={data.company}
        owners={options?.users ?? []}
        tags={options?.tags ?? []}
        sizes={options?.companySizes ?? []}
        industries={options?.industries ?? []}
      />
    </div>
  );
}
