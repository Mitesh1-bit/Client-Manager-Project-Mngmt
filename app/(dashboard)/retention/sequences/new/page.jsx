import { BackLink } from "@/app/components/domain/back-link";
import { PageHeader } from "@/app/components/domain/page-header";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { RetentionFormOptionsDocument } from "@/app/lib/graphql/generated/documents";

import { SequenceBuilder } from "../sequence-builder";

export const metadata = { title: "New sequence" };

export default async function NewSequencePage() {
  const { data } = await getClient().query({ query: RetentionFormOptionsDocument });
  const companies = data?.companies ?? [];

  return (
    <div className="mx-auto w-full max-w-3xl">
      <BackLink href="/retention/sequences">Sequences</BackLink>

      <PageHeader
        title="New sequence"
        description="Link a client company, define steps and timing, then save as draft or submit for approval."
      />

      <SequenceBuilder mode="create" companies={companies} />
    </div>
  );
}
