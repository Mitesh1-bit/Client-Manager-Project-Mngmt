import Link from "next/link";
import { Plus, Workflow } from "lucide-react";

import { PageHeader } from "@/app/components/domain/page-header";
import { EmptyState } from "@/app/components/domain/states";
import { Button } from "@/app/components/ui/button";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { RetentionSequencesDocument } from "@/app/lib/graphql/generated/documents";

import { RetentionTabs } from "../retention-tabs";
import { SequenceCard } from "./sequence-card";

export const metadata = { title: "Sequences" };

export default async function RetentionSequencesPage() {
  const { data } = await getClient().query({
    query: RetentionSequencesDocument,
    variables: { activeOnly: false },
  });
  const sequences = data.retentionSequences ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Retention"
        description="Automated touchpoint sequences and who's currently enrolled in each one."
        actions={
          <Button asChild>
            <Link href="/retention/sequences/new">
              <Plus aria-hidden="true" />
              New sequence
            </Link>
          </Button>
        }
      />

      <div className="space-y-4">
        <RetentionTabs counts={{ "/retention/sequences": sequences.length }} />

        {sequences.length === 0 ? (
          <EmptyState
            icon={Workflow}
            title="No sequences yet"
            description="A sequence is a set of touchpoints that fire automatically after a company enrolls — onboarding, quarterly reviews, renewal outreach."
            action={
              <Button asChild>
                <Link href="/retention/sequences/new">
                  <Plus aria-hidden="true" />
                  New sequence
                </Link>
              </Button>
            }
          />
        ) : (
          <div data-tour="retention-sequences-list" className="grid gap-4 lg:grid-cols-2">
            {sequences.map((sequence) => (
              <SequenceCard key={sequence.id} sequence={sequence} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
