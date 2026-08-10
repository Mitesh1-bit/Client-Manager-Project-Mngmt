import { BackLink } from "@/app/components/domain/back-link";
import { EmptyState } from "@/app/components/domain/states";
import { PageHeader } from "@/app/components/domain/page-header";
import { Button } from "@/app/components/ui/button";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { RetentionFormOptionsDocument } from "@/app/lib/graphql/generated/documents";
import { RETENTION_LOCKED_DESCRIPTION, RETENTION_MODULE_DESCRIPTION } from "@/app/lib/retention";

import { SequenceBuilder } from "../sequence-builder";

export const metadata = { title: "New sequence" };

export default async function NewSequencePage() {
  const { data } = await getClient().query({ query: RetentionFormOptionsDocument });
  const companies = data?.retentionEligibleCompanies ?? [];

  return (
    <div className="mx-auto w-full max-w-3xl">
      <BackLink href="/retention/sequences">Sequences</BackLink>

      <PageHeader
        title="New sequence"
        description={RETENTION_MODULE_DESCRIPTION}
      />

      {companies.length === 0 ? (
        <EmptyState
          title="Retention is locked"
          description={RETENTION_LOCKED_DESCRIPTION}
          className="mt-6"
          action={
            <Button asChild variant="outline">
              <a href="/projects">View projects</a>
            </Button>
          }
        />
      ) : (
        <SequenceBuilder mode="create" companies={companies} />
      )}
    </div>
  );
}
