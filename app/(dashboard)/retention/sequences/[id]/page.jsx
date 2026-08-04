import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil, UserPlus, Users } from "lucide-react";

import { EnrollInSequenceDialog } from "@/app/components/domain/enroll-in-sequence-dialog";
import { SectionCard, EmptyState } from "@/app/components/domain/states";
import { Button } from "@/app/components/ui/button";
import { pickList } from "@/app/lib/api/safe-list";
import { getClient } from "@/app/lib/graphql/apollo-client";
import {
  RetentionFormOptionsDocument,
  RetentionSequenceDetailDocument,
} from "@/app/lib/graphql/generated/documents";

import { EnrollmentRow } from "./enrollment-row";
import { SequenceStepTimeline } from "./sequence-step-timeline";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const { data } = await getClient().query({
    query: RetentionSequenceDetailDocument,
    variables: { id },
  });
  return { title: data.retentionSequence?.name ?? "Sequence" };
}

const TRIGGER_LABELS = {
  MANUAL: "Started manually",
  ON_COMPANY_CREATED: "Starts when a company is created",
  ON_PROJECT_COMPLETED: "Starts when a project completes",
  ON_RENEWAL_APPROACHING: "Starts as a renewal approaches",
};

export default async function SequenceDetailPage({ params }) {
  const { id } = await params;

  const [{ data }, { data: options }] = await Promise.all([
    getClient().query({ query: RetentionSequenceDetailDocument, variables: { id } }),
    getClient().query({ query: RetentionFormOptionsDocument }),
  ]);

  const sequence = data.retentionSequence;
  if (!sequence) notFound();

  const activeEnrollments = sequence.enrollments.filter((e) => e.status === "ACTIVE");
  const otherEnrollments = sequence.enrollments.filter((e) => e.status !== "ACTIVE");
  const enrolledCompanyIds = new Set(
    sequence.enrollments.filter((e) => e.status === "ACTIVE").map((e) => e.company.id),
  );
  const enrollableCompanies = pickList(options, "companies").filter(
    (company) => !enrolledCompanyIds.has(company.id),
  );

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/retention/sequences"
        className="mb-4 inline-flex items-center gap-1 rounded-sm text-caption text-muted-foreground hover:text-foreground focus-ring"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        Sequences
      </Link>

      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-title text-balance">{sequence.name}</h1>
            <span
              className={
                sequence.isActive
                  ? "inline-flex items-center rounded-full border border-tone-positive-border bg-tone-positive-bg px-2 py-0.5 text-[0.75rem] font-medium text-tone-positive-fg"
                  : "inline-flex items-center rounded-full border bg-muted px-2 py-0.5 text-[0.75rem] font-medium text-muted-foreground"
              }
            >
              {sequence.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="mt-1.5 text-caption text-muted-foreground">
            {TRIGGER_LABELS[sequence.triggerType] ?? sequence.triggerType}
          </p>
          {sequence.description ? (
            <p className="mt-2 max-w-xl text-caption text-pretty text-muted-foreground">
              {sequence.description}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/retention/sequences/${id}/edit`}>
              <Pencil aria-hidden="true" />
              Edit
            </Link>
          </Button>
          <EnrollInSequenceDialog
            sequenceId={sequence.id}
            sequenceName={sequence.name}
            companies={enrollableCompanies}
            trigger={
              <Button disabled={!sequence.isActive}>
                <UserPlus aria-hidden="true" />
                Enroll a company
              </Button>
            }
          />
        </div>
      </header>

      {!sequence.isActive ? (
        <p className="mb-5 rounded-lg border border-tone-caution-border bg-tone-caution-bg px-3.5 py-2.5 text-caption text-tone-caution-fg">
          This sequence is inactive, so it can&apos;t take new enrollments. Edit it to reactivate.
        </p>
      ) : null}

      <div className="space-y-5">
        <SectionCard data-tour="sequence-steps" title="Steps">
          <SequenceStepTimeline steps={sequence.steps} />
        </SectionCard>

        <SectionCard
          data-tour="sequence-enrollments"
          title="Enrollments"
          description={`${activeEnrollments.length} active`}
        >
          {sequence.enrollments.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nobody enrolled yet"
              description="Enroll a company to start scheduling this sequence's touchpoints for them."
              className="border-0 bg-transparent py-6"
            />
          ) : (
            <div className="space-y-4">
              {activeEnrollments.length > 0 ? (
                <ul className="space-y-2.5">
                  {activeEnrollments.map((enrollment) => (
                    <EnrollmentRow
                      key={enrollment.id}
                      enrollment={enrollment}
                      totalSteps={sequence.steps.length}
                    />
                  ))}
                </ul>
              ) : null}

              {otherEnrollments.length > 0 ? (
                <details className="group">
                  <summary className="cursor-pointer text-caption text-muted-foreground hover:text-foreground">
                    {otherEnrollments.length} paused, completed or cancelled
                  </summary>
                  <ul className="mt-2.5 space-y-2.5">
                    {otherEnrollments.map((enrollment) => (
                      <EnrollmentRow
                        key={enrollment.id}
                        enrollment={enrollment}
                        totalSteps={sequence.steps.length}
                      />
                    ))}
                  </ul>
                </details>
              ) : null}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
