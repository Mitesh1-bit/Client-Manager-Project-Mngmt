import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

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
  return { title: data.company ? `Edit ${data.company.name}` : "Edit company" };
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
      <Link
        href={`/companies/${id}`}
        className="mb-4 inline-flex items-center gap-1 rounded-sm text-caption text-muted-foreground hover:text-foreground focus-ring"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        Back to {data.company.name}
      </Link>

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
