import { notFound } from "next/navigation";

import { BackLink } from "@/app/components/domain/back-link";
import { PageHeader } from "@/app/components/domain/page-header";
import { normalizeRetentionSequence } from "@/app/lib/api/normalize";
import { getClient } from "@/app/lib/graphql/apollo-client";
import {
  RetentionFormOptionsDocument,
  RetentionSequenceDetailDocument,
} from "@/app/lib/graphql/generated/documents";

import { SequenceBuilder } from "../../sequence-builder";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const { data } = await getClient().query({
    query: RetentionSequenceDetailDocument,
    variables: { id },
  });
  return { title: data.retentionSequence ? `Edit ${data.retentionSequence.name}` : "Edit sequence" };
}

export default async function EditSequencePage({ params }) {
  const { id } = await params;
  const [{ data }, { data: options }] = await Promise.all([
    getClient().query({ query: RetentionSequenceDetailDocument, variables: { id } }),
    getClient().query({ query: RetentionFormOptionsDocument }),
  ]);

  if (!data.retentionSequence) notFound();

  const sequence = normalizeRetentionSequence(data.retentionSequence);
  const eligibleCompanies = options?.retentionEligibleCompanies ?? [];
  const companies =
    sequence.companyId && !eligibleCompanies.some((company) => company.id === sequence.companyId)
      ? [
          ...eligibleCompanies,
          {
            id: sequence.companyId,
            name: sequence.company?.name ?? "Client",
            contacts: [],
          },
        ]
      : eligibleCompanies;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <BackLink href={`/retention/sequences/${id}`}>Back to {sequence.name}</BackLink>

      <PageHeader title={`Edit ${sequence.name}`} />

      <SequenceBuilder key={sequence.id} mode="edit" sequence={sequence} companies={companies} />
    </div>
  );
}
