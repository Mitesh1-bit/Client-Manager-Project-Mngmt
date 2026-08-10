"use client";

import Link from "next/link";
import { Phone, TriangleAlert, UserRound, Workflow } from "lucide-react";

import { EnrollInSequenceDialog } from "@/app/components/domain/enroll-in-sequence-dialog";
import { EntityAvatar } from "@/app/components/domain/entity-avatar";
import { HealthScoreBadge } from "@/app/components/domain/health-score-badge";
import { StatusBadge } from "@/app/components/domain/status-badge";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";

const REASON_META = {
  LOW_HEALTH_SCORE: { label: "Low health score", tone: "critical" },
};

const REASON_TONE_CLASSES = {
  critical: "border-tone-critical-border bg-tone-critical-bg text-tone-critical-fg",
  caution: "border-tone-caution-border bg-tone-caution-bg text-tone-caution-fg",
  info: "border-tone-info-border bg-tone-info-bg text-tone-info-fg",
};

/** At-risk row — health score plus retention sequence actions. */
export function AtRiskCompanyCard({ row, sequences }) {
  const { company, reasons, activeEnrollments } = row;
  const companySequences = sequences.filter(
    (sequence) => !sequence.companyId || sequence.companyId === company.id,
  );
  const enrolledContactIds = activeEnrollments.map((enrollment) => enrollment.contact?.id).filter(Boolean);

  return (
    <article className="rounded-2xl border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <EntityAvatar name={company.name} kind="company" size="md" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/companies/${company.id}`}
                className="font-semibold hover:underline focus-ring rounded-sm"
              >
                {company.name}
              </Link>
              <StatusBadge kind="companyStatus" value={company.status} size="sm" />
            </div>
            <p className="mt-0.5 text-caption text-muted-foreground">
              {company.industry ?? "No industry set"}
              {company.accountOwner ? ` · owned by ${company.accountOwner.name}` : ""}
            </p>
          </div>
        </div>

        <HealthScoreBadge
          score={company.healthScore}
          history={company.healthScoreTrend?.map((point) => point.score) ?? []}
          size="sm"
          showSparkline={false}
        />
      </div>

      <ul className="mt-3 flex flex-wrap gap-1.5">
        {reasons.map((reason) => {
          const meta = REASON_META[reason] ?? { label: reason, tone: "info" };
          return (
            <li
              key={reason}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.75rem] font-medium",
                REASON_TONE_CLASSES[meta.tone],
              )}
            >
              <TriangleAlert aria-hidden="true" className="size-3" />
              {meta.label}
            </li>
          );
        })}
      </ul>

      {company.primaryContact ? (
        <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-caption text-muted-foreground">
          <div className="flex min-w-0 items-center gap-1.5">
            <UserRound aria-hidden="true" className="size-3.5 shrink-0" />
            <dt className="sr-only">Primary contact</dt>
            <dd className="truncate">
              {company.primaryContact.firstName} {company.primaryContact.lastName}
            </dd>
          </div>
        </dl>
      ) : null}

      {activeEnrollments.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {activeEnrollments.map((enrollment) => (
            <li
              key={enrollment.id}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[0.75rem] text-muted-foreground"
            >
              <Workflow aria-hidden="true" className="size-3" />
              {enrollment.sequence.name}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3.5">
        <EnrollInSequenceDialog
          companyId={company.id}
          companyName={company.name}
          sequences={companySequences}
          contacts={company.contacts}
          enrolledContactIds={enrolledContactIds}
          trigger={
            <Button variant="outline" size="sm">
              <Workflow aria-hidden="true" />
              Enroll in sequence
            </Button>
          }
        />
        {company.primaryContact?.phone ? (
          <Button variant="ghost" size="sm" asChild>
            <a href={`tel:${company.primaryContact.phone}`}>
              <Phone aria-hidden="true" />
              Call
            </a>
          </Button>
        ) : null}
      </div>
    </article>
  );
}
