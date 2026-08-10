import Link from "next/link";
import { Building2, ChevronRight, Sparkles, Users } from "lucide-react";

import { channelIcon } from "@/app/lib/channels";
import { humanizeType } from "@/app/lib/format";
import { cn } from "@/app/lib/utils";

import { SEQUENCE_SOURCE_LABELS, SEQUENCE_STATUS_LABELS } from "./sequence-schema";

const TRIGGER_LABELS = {
  MANUAL: "Manual post-delivery follow-ups",
  ON_PROJECT_COMPLETED: "Starts when a project completes",
};

const STATUS_STYLES = {
  DRAFT: "border-border bg-muted text-muted-foreground",
  PENDING: "border-tone-caution-border bg-tone-caution-bg text-tone-caution-fg",
  APPROVED: "border-tone-positive-border bg-tone-positive-bg text-tone-positive-fg",
  ACTIVE: "border-tone-positive-border bg-tone-positive-bg text-tone-positive-fg",
  REJECTED: "border-destructive/30 bg-destructive/5 text-destructive",
};

export function SequenceCard({ sequence }) {
  const sortedSteps = [...sequence.steps].sort((a, b) => a.stepOrder - b.stepOrder);
  const totalDays = sortedSteps.at(-1)?.offsetDays ?? 0;
  const status = sequence.status ?? "DRAFT";

  return (
    <Link
      href={`/retention/sequences/${sequence.id}`}
      className="group block rounded-2xl border bg-card p-4 transition-shadow hover:shadow-raised focus-ring sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-pretty">{sequence.name}</h2>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[0.6875rem] font-medium",
                STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT,
              )}
            >
              {SEQUENCE_STATUS_LABELS[status] ?? humanizeType(status)}
            </span>
            {sequence.source === "AI" ? (
              <span className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[0.6875rem] font-medium text-muted-foreground">
                <Sparkles aria-hidden="true" className="size-3" />
                {SEQUENCE_SOURCE_LABELS.AI}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-caption text-muted-foreground">
            {TRIGGER_LABELS[sequence.triggerType] ?? humanizeType(sequence.triggerType)}
          </p>
          {sequence.company?.name ? (
            <p className="mt-1 flex items-center gap-1.5 text-caption text-muted-foreground">
              <Building2 aria-hidden="true" className="size-3.5 shrink-0" />
              {sequence.company.name}
            </p>
          ) : null}
        </div>
        <ChevronRight
          aria-hidden="true"
          className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        />
      </div>

      {sequence.description ? (
        <p className="mt-3 text-caption text-pretty text-muted-foreground">{sequence.description}</p>
      ) : null}

      <ol className="mt-4 flex flex-wrap items-center gap-x-1 gap-y-1.5">
        {sortedSteps.map((step, index) => {
          const Icon = channelIcon(step.channel);
          return (
            <li key={step.id} className="flex items-center gap-1">
              <span
                title={`${step.name || "Step"} · day ${step.offsetDays}`}
                className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground"
              >
                <Icon aria-hidden="true" className="size-3.5" />
              </span>
              {index < sortedSteps.length - 1 ? (
                <span aria-hidden="true" className="h-px w-3 bg-border" />
              ) : null}
            </li>
          );
        })}
      </ol>

      <dl className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-caption text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Steps</dt>
          <dd>
            {sortedSteps.length} step{sortedSteps.length === 1 ? "" : "s"} over {totalDays} day
            {totalDays === 1 ? "" : "s"}
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Active enrollments</dt>
          <Users aria-hidden="true" className="size-3.5" />
          <dd className="tabular">
            {sequence.activeEnrollmentCount} active enrollment
            {sequence.activeEnrollmentCount === 1 ? "" : "s"}
          </dd>
        </div>
        {sequence.createdBy?.name ? (
          <div>
            <dt className="sr-only">Created by</dt>
            <dd>By {sequence.createdBy.name}</dd>
          </div>
        ) : null}
      </dl>
    </Link>
  );
}
