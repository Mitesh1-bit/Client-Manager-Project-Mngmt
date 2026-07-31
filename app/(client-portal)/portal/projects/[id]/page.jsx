import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, FileText, GitPullRequestArrow, Mail } from "lucide-react";

import {
  AwaitingYouBanner,
  MilestoneApprovalPanel,
} from "@/app/components/domain/milestone-approval-panel";
import { EmptyState } from "@/app/components/domain/states";
import { StatusBadge } from "@/app/components/domain/status-badge";
import { Button } from "@/app/components/ui/button";
import { Progress } from "@/app/components/ui/progress";
import { APPROVAL_STATE, getMilestoneApprovalState } from "@/app/lib/approvals";
import { formatBytes, formatDate, formatRelativeDays, initials } from "@/app/lib/format";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { PortalProjectDocument } from "@/app/lib/graphql/generated/documents";
import { parseDay, startOfDay } from "@/app/lib/project";
import { cn } from "@/app/lib/utils";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const { data } = await getClient().query({ query: PortalProjectDocument, variables: { id } });
  return { title: data.project?.name ?? "Project" };
}

export default async function PortalProjectPage({ params }) {
  const { id } = await params;
  const { data } = await getClient().query({ query: PortalProjectDocument, variables: { id } });

  // The API scopes `project` to the caller's own company, so a project from
  // another client reads as "not found" rather than "forbidden".
  const project = data.project;
  if (!project) notFound();

  const viewerName = data.me?.contact?.fullName ?? null;

  const milestoneStates = project.milestones.map((milestone) => ({
    milestone,
    approvalState: getMilestoneApprovalState(milestone, viewerName),
  }));

  const awaitingYou = milestoneStates.filter((entry) => entry.approvalState.actionable);
  const upcoming = milestoneStates.filter(
    (entry) =>
      entry.milestone.status !== "COMPLETED" &&
      !entry.approvalState.actionable,
  );
  const completed = milestoneStates.filter((entry) => entry.milestone.status === "COMPLETED");

  const endsAt = parseDay(project.endDate);
  const overdue =
    endsAt && project.status !== "COMPLETED" && endsAt < startOfDay(new Date());

  return (
    <>
      <Link
        href="/portal/projects"
        className="mb-4 inline-flex items-center gap-1 rounded-sm text-caption text-muted-foreground hover:text-foreground focus-ring"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        All projects
      </Link>

      <header className="mb-6">
        <h1 className="text-title text-balance">{project.name}</h1>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <StatusBadge kind="projectStatus" value={project.status} />
          <StatusBadge kind="projectHealth" value={project.health} />
        </div>
        {project.description ? (
          <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">{project.description}</p>
        ) : null}
      </header>

      <div className="space-y-6">
        {awaitingYou.length > 0 ? <AwaitingYouBanner count={awaitingYou.length} /> : null}

        <section className="rounded-2xl border bg-card p-4 sm:p-5">
          <h2 className="text-subheading">Where we&apos;ve got to</h2>

          <div className="mt-4">
            <div className="flex items-end justify-between gap-3">
              <span className="text-caption text-muted-foreground">Overall progress</span>
              <span className="tabular text-heading font-semibold">
                {project.completionPercent}%
              </span>
            </div>
            <Progress
              value={project.completionPercent}
              aria-label={`${project.name} is ${project.completionPercent}% complete`}
              className="mt-2 h-2.5"
            />
          </div>

          <dl className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-caption text-muted-foreground">Started</dt>
              <dd className="mt-0.5 font-medium">{formatDate(project.startDate)}</dd>
            </div>
            <div>
              <dt className="text-caption text-muted-foreground">Target finish</dt>
              <dd className={cn("mt-0.5 font-medium", overdue && "text-tone-critical-fg")}>
                {formatDate(project.endDate)}
                {overdue ? <span className="ml-1.5 font-normal">(running late)</span> : null}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-muted-foreground">Milestones done</dt>
              <dd className="tabular mt-0.5 font-medium">
                {completed.length} of {project.milestones.length}
              </dd>
            </div>
          </dl>

          {project.projectManager ? (
            <div className="mt-5 flex flex-wrap items-center gap-3 border-t pt-4">
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-caption font-medium"
              >
                {initials(project.projectManager.name)}
              </span>
              <div className="min-w-0">
                <p className="text-caption font-medium">{project.projectManager.name}</p>
                <p className="text-[0.75rem] text-muted-foreground">
                  Your project manager at Meridian
                </p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto" asChild>
                <a href={`mailto:${project.projectManager.email}`}>
                  <Mail aria-hidden="true" />
                  Get in touch
                </a>
              </Button>
            </div>
          ) : null}
        </section>

        {awaitingYou.length > 0 ? (
          <section aria-labelledby="awaiting-you" className="space-y-4">
            <h2 id="awaiting-you" className="text-subheading">
              Waiting on you
            </h2>
            {awaitingYou.map(({ milestone }) => (
              <MilestoneApprovalPanel
                key={milestone.id}
                milestone={milestone}
                viewerName={viewerName}
              />
            ))}
          </section>
        ) : null}

        <section aria-labelledby="plan" className="space-y-4">
          <h2 id="plan" className="text-subheading">
            The plan
          </h2>

          {project.milestones.length === 0 ? (
            <EmptyState
              title="No milestones yet"
              description="We're still shaping the plan. It'll appear here as soon as it's agreed."
            />
          ) : (
            <ol className="space-y-3">
              {[...upcoming, ...completed].map(({ milestone, approvalState }) => (
                <MilestoneRow
                  key={milestone.id}
                  milestone={milestone}
                  approvalState={approvalState}
                />
              ))}
            </ol>
          )}
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section
            aria-labelledby="deliverables"
            className="min-w-0 rounded-2xl border bg-card p-4 sm:p-5"
          >
            <h2 id="deliverables" className="text-subheading">
              Files for this project
            </h2>
            {project.documents.length === 0 ? (
              <p className="mt-3 text-caption text-muted-foreground">
                Nothing shared yet. Deliverables will show up here as we finish them.
              </p>
            ) : (
              <ul className="mt-3 space-y-1.5">
                {project.documents.map((document) => (
                  <li key={document.id}>
                    <a
                      href={document.fileUrl}
                      download
                      className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-colors hover:bg-accent focus-ring"
                    >
                      <FileText
                        aria-hidden="true"
                        className="size-4 shrink-0 text-muted-foreground"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-caption font-medium">
                          {document.name}
                        </span>
                        <span className="block text-[0.75rem] text-muted-foreground">
                          v{document.version} · {formatBytes(document.sizeBytes)} ·{" "}
                          {formatDate(document.createdAt)}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section
            aria-labelledby="requests"
            className="min-w-0 rounded-2xl border bg-card p-4 sm:p-5"
          >
            <h2 id="requests" className="text-subheading">
              Change requests
            </h2>
            {project.changeRequests.length === 0 ? (
              <p className="mt-3 text-caption text-muted-foreground">
                No changes have been requested on this project.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {project.changeRequests.map((request) => (
                  <li
                    key={request.id}
                    className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2.5"
                  >
                    <GitPullRequestArrow
                      aria-hidden="true"
                      className="size-4 shrink-0 text-muted-foreground"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-caption font-medium">
                        {request.title}
                      </span>
                      <span className="tabular block text-[0.75rem] text-muted-foreground">
                        {request.reference} · updated {formatRelativeDays(request.updatedAt)}
                      </span>
                    </span>
                    <StatusBadge kind="changeRequestStatus" value={request.status} size="sm" />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function MilestoneRow({ milestone, approvalState }) {
  const done = milestone.status === "COMPLETED";
  const dueDate = parseDay(milestone.dueDate);
  const overdue = dueDate && !done && dueDate < startOfDay(new Date());

  return (
    <li className="rounded-2xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "mt-0.5 size-2.5 shrink-0 rounded-full",
            done
              ? "bg-tone-positive"
              : approvalState.state === APPROVAL_STATE.CHANGES_REQUESTED
                ? "bg-tone-critical"
                : overdue
                  ? "bg-tone-critical"
                  : "bg-muted-foreground/40",
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={cn("font-medium text-pretty", done && "text-muted-foreground")}>
              {milestone.title}
            </h3>
            <StatusBadge kind="milestoneStatus" value={milestone.status} size="sm" />
          </div>

          {milestone.description ? (
            <p className="mt-1 text-caption text-pretty text-muted-foreground">
              {milestone.description}
            </p>
          ) : null}

          <p
            className={cn(
              "mt-1.5 text-[0.75rem]",
              overdue ? "font-medium text-tone-critical-fg" : "text-muted-foreground",
            )}
          >
            {done && milestone.approvedAt
              ? `Signed off ${formatDate(milestone.approvedAt)}`
              : `Due ${formatDate(milestone.dueDate)}${overdue ? " · running late" : ""}`}
          </p>

          {milestone.requiresClientApproval &&
          approvalState.state !== APPROVAL_STATE.NOT_REQUIRED ? (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[0.75rem] text-muted-foreground">
              {approvalState.label}
              {approvalState.waitingOn ? ` · ${approvalState.waitingOn}` : ""}
            </p>
          ) : null}
        </div>
      </div>
    </li>
  );
}
