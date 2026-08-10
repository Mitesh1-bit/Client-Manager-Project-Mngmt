import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Pencil, Sparkles, UserPlus, Users } from "lucide-react";

import { BackLink } from "@/app/components/domain/back-link";
import { EnrollInSequenceDialog } from "@/app/components/domain/enroll-in-sequence-dialog";
import { SectionCard, EmptyState } from "@/app/components/domain/states";
import { Button } from "@/app/components/ui/button";
import { normalizeRetentionSequence } from "@/app/lib/api/normalize";
import { pickList } from "@/app/lib/api/safe-list";
import { formatDateTime } from "@/app/lib/format";
import { getClient } from "@/app/lib/graphql/apollo-client";
import {
  RetentionFormOptionsDocument,
  RetentionSequenceDetailDocument,
} from "@/app/lib/graphql/generated/documents";

import { EnrollmentRow } from "./enrollment-row";
import { SequenceStepTimeline } from "./sequence-step-timeline";
import { SequenceApprovalPanel } from "../sequence-approval-panel";
import { DuplicateSequenceButton } from "../duplicate-sequence-button";
import {
  isSequenceEditable,
  isSequenceEnrollable,
  SEQUENCE_SOURCE_LABELS,
  SEQUENCE_STATUS_LABELS,
} from "../sequence-schema";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const { data } = await getClient().query({
    query: RetentionSequenceDetailDocument,
    variables: { id },
  });
  return { title: data.retentionSequence?.name ?? "Sequence" };
}

const TRIGGER_LABELS = {
  MANUAL: "Started manually after delivery",
  ON_PROJECT_COMPLETED: "Starts automatically when a project completes",
};

function isActiveEnrollment(status) {
  return String(status).toLowerCase() === "active";
}

export default async function SequenceDetailPage({ params }) {
  const { id } = await params;

  const [{ data }, { data: options }] = await Promise.all([
    getClient().query({ query: RetentionSequenceDetailDocument, variables: { id } }),
    getClient().query({ query: RetentionFormOptionsDocument }),
  ]);

  const rawSequence = data.retentionSequence;
  if (!rawSequence) notFound();

  const sequence = normalizeRetentionSequence(rawSequence);
  const enrollable = isSequenceEnrollable(sequence);
  const editable = isSequenceEditable(sequence);

  const activeEnrollments = sequence.enrollments.filter((e) => isActiveEnrollment(e.status));
  const otherEnrollments = sequence.enrollments.filter((e) => !isActiveEnrollment(e.status));
  const enrolledContactIds = activeEnrollments.map((e) => e.contact.id);
  const companyFromOptions = pickList(options, "retentionEligibleCompanies").find(
    (company) => company.id === sequence.companyId,
  );
  const companyContacts = companyFromOptions?.contacts ?? [];
  const enrollableCompanies = pickList(options, "retentionEligibleCompanies");
  const retentionEligible = Boolean(companyFromOptions ?? !sequence.companyId);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <BackLink href="/retention/sequences">Sequences</BackLink>

      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-title text-balance">{sequence.name}</h1>
            <span className="inline-flex items-center rounded-full border bg-muted px-2 py-0.5 text-[0.75rem] font-medium text-muted-foreground">
              {SEQUENCE_STATUS_LABELS[sequence.status] ?? sequence.status}
            </span>
            {sequence.source === "AI" ? (
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.75rem] font-medium text-muted-foreground">
                <Sparkles aria-hidden="true" className="size-3.5" />
                {SEQUENCE_SOURCE_LABELS.AI}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[0.75rem] font-medium text-muted-foreground">
                {SEQUENCE_SOURCE_LABELS.MANUAL}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-caption text-muted-foreground">
            {TRIGGER_LABELS[sequence.triggerType] ?? sequence.triggerType}
          </p>
          {sequence.company?.name && sequence.companyId ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-caption text-muted-foreground">
              <Building2 aria-hidden="true" className="size-3.5" />
              <Link href={`/companies/${sequence.companyId}`} className="hover:text-foreground hover:underline">
                {sequence.company.name}
              </Link>
            </p>
          ) : null}
          {sequence.description ? (
            <p className="mt-2 max-w-xl text-caption text-pretty text-muted-foreground">
              {sequence.description}
            </p>
          ) : null}
          <dl className="mt-3 space-y-1 text-[0.75rem] text-muted-foreground">
            {sequence.createdBy?.name ? (
              <div>
                Created by {sequence.createdBy.name}
                {sequence.createdAt ? ` · ${formatDateTime(sequence.createdAt)}` : ""}
              </div>
            ) : null}
            {sequence.approvedBy?.name ? (
              <div>
                Approved by {sequence.approvedBy.name}
                {sequence.approvedAt ? ` · ${formatDateTime(sequence.approvedAt)}` : ""}
              </div>
            ) : null}
          </dl>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
          <DuplicateSequenceButton sequenceId={sequence.id} />
          {editable ? (
            <Button variant="outline" asChild>
              <Link href={`/retention/sequences/${id}/edit`}>
                <Pencil aria-hidden="true" />
                Edit
              </Link>
            </Button>
          ) : null}
          <EnrollInSequenceDialog
            sequenceId={sequence.id}
            sequenceName={sequence.name}
            companyId={sequence.companyId}
            companyName={sequence.company?.name}
            companies={enrollableCompanies}
            contacts={companyContacts}
            enrolledContactIds={enrolledContactIds}
            retentionEligible={retentionEligible}
            trigger={
              <Button disabled={!enrollable || !retentionEligible || companyContacts.length === 0}>
                <UserPlus aria-hidden="true" />
                Enroll a client
              </Button>
            }
          />
        </div>
      </header>

      <SequenceApprovalPanel
        sequenceId={sequence.id}
        status={sequence.status}
        aiRationale={sequence.aiRationale}
        rejectionReason={sequence.rejectionReason}
      />

      {!enrollable ? (
        <p className="mb-5 rounded-lg border border-tone-caution-border bg-tone-caution-bg px-3.5 py-2.5 text-caption text-tone-caution-fg">
          This sequence isn&apos;t approved yet, so it can&apos;t take new enrollments.
        </p>
      ) : !retentionEligible ? (
        <p className="mb-5 rounded-lg border border-tone-caution-border bg-tone-caution-bg px-3.5 py-2.5 text-caption text-tone-caution-fg">
          Retention is locked until this client&apos;s projects are completed end-to-end and no
          delivery work is still in progress.
        </p>
      ) : null}

      {sequence.aiRationale && sequence.status !== "PENDING" ? (
        <SectionCard title="Retention strategy" className="mb-5">
          <p className="text-caption text-pretty text-muted-foreground">{sequence.aiRationale}</p>
        </SectionCard>
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
              description="Enroll a client after project delivery to schedule call and email follow-ups."
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
