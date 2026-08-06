import { notFound } from "next/navigation";

import { BackLink } from "@/app/components/domain/back-link";
import { PageHeader } from "@/app/components/domain/page-header";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { RetentionSequenceDetailDocument } from "@/app/lib/graphql/generated/documents";

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
  const { data } = await getClient().query({
    query: RetentionSequenceDetailDocument,
    variables: { id },
  });

  if (!data.retentionSequence) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <BackLink href={`/retention/sequences/${id}`}>Back to {data.retentionSequence.name}</BackLink>

      <PageHeader title={`Edit ${data.retentionSequence.name}`} />

      <SequenceBuilder mode="edit" sequence={data.retentionSequence} />
    </div>
  );
}
