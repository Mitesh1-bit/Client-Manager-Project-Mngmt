import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, GitPullRequestArrow, Mail, Plus, ShieldCheck } from "lucide-react";

import { MilestoneApprovalPanel } from "@/app/components/domain/milestone-approval-panel";
import { StatusBadge } from "@/app/components/domain/status-badge";
import { Button } from "@/app/components/ui/button";
import { Progress } from "@/app/components/ui/progress";
import { APPROVAL_STATE, getMilestoneApprovalState } from "@/app/lib/approvals";
import { normalizePortalProject, portalContactName } from "@/app/lib/api/portal";
import { portalDocumentHref, portalDocumentName } from "@/app/lib/api/portal-ui";
import { formatDate, formatRelativeDays, initials } from "@/app/lib/format";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { PortalProjectDocument } from "@/app/lib/graphql/generated/documents";
import { parseDay, startOfDay } from "@/app/lib/project";
import { cn } from "@/app/lib/utils";

import {
  PortalActionBanner,
  PortalBackLink,
  PortalCard,
  PortalEmptyPanel,
  PortalLinkRow,
  PortalPageHeader,
  PortalSectionHeader,
} from "../../portal-ui";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const { data } = await getClient().query({ query: PortalProjectDocument, variables: { id } });
  return { title: data.project?.name ?? "Project" };
}

export default async function PortalProjectPage({ params }) {
  const { id } = await params;
  const { data } = await getClient().query({ query: PortalProjectDocument, variables: { id } });

  const project = normalizePortalProject(data.project);
  if (!project) notFound();

  const viewerName = portalContactName(data.me?.contact);

  const milestoneStates = (project.milestones ?? []).map((milestone) => ({
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
      <PortalBackLink href="/portal/projects">All projects</PortalBackLink>

      <div className="mb-6">
        <PortalPageHeader
          title={project.name}
          description={project.description ?? undefined}
          actions={
            <Button variant="outline" size="sm" className="shrink-0" asChild>
              <Link href={`/portal/change-requests/new?projectId=${project.id}`}>
                <Plus aria-hidden="true" />
                Request a change
              </Link>
            </Button>
          }
          className="!pb-4"
        />
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge kind="projectStatus" value={project.status} />
          <StatusBadge kind="projectHealth" value={project.health} />
        </div>
      </div>

      <div className="space-y-6">
        {awaitingYou.length > 0 ? (
          <PortalActionBanner
            icon={ShieldCheck}
            title={
              awaitingYou.length === 1
                ? "1 milestone needs your approval"
                : `${awaitingYou.length} milestones need your approval`
            }
            description="Review and sign off below, or request changes if something isn't right."
            action={
              <Button size="sm" className="bg-[#0a1550] hover:bg-[#1e3a8a]" asChild>
                <Link href="/portal/approvals">Open approvals inbox</Link>
              </Button>
            }
          />
        ) : null}

        <PortalCard>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div
              className="portal-progress-ring mx-auto shrink-0 sm:mx-0"
              style={{ "--progress": project.completionPercent }}
              role="img"
              aria-label={`${project.completionPercent}% complete`}
            >
              <span>{project.completionPercent}%</span>
            </div>
            <div className="min-w-0 flex-1">
              <PortalSectionHeader title="Where we've got to" />
              <Progress
                value={project.completionPercent}
                aria-label={`${project.name} is ${project.completionPercent}% complete`}
                className="h-2.5"
              />
              <dl className="mt-5 grid gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Started</dt>
                  <dd className="mt-0.5 font-medium">{formatDate(project.startDate)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Target finish</dt>
                  <dd className={cn("mt-0.5 font-medium", overdue && "text-tone-critical-fg")}>
                    {formatDate(project.endDate)}
                    {overdue ? <span className="ml-1.5 font-normal">(running late)</span> : null}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Milestones done</dt>
                  <dd className="tabular mt-0.5 font-medium">
                    {completed.length} of {project.milestones.length}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {project.projectManager ? (
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[oklch(0.93_0.01_255)] pt-5">
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[oklch(0.96_0.015_255)] text-xs font-semibold text-[#1e3a8a]"
              >
                {initials(project.projectManager.name)}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">{project.projectManager.name}</p>
                <p className="text-xs text-muted-foreground">Your project manager</p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto" asChild>
                <a href={`mailto:${project.projectManager.email}`}>
                  <Mail aria-hidden="true" />
                  Get in touch
                </a>
              </Button>
            </div>
          ) : null}
        </PortalCard>

        {awaitingYou.length > 0 ? (
          <section aria-labelledby="awaiting-you" className="space-y-4">
            <PortalSectionHeader
              id="awaiting-you"
              title="Waiting on you"
              action={
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/portal/approvals">View all approvals</Link>
                </Button>
              }
            />
            {awaitingYou.map(({ milestone }) => (
              <div key={milestone.id} id={`milestone-${milestone.id}`}>
                <MilestoneApprovalPanel milestone={milestone} viewerName={viewerName} />
              </div>
            ))}
          </section>
        ) : null}

        <section aria-labelledby="plan">
          <PortalSectionHeader id="plan" title="The plan" />

          {project.milestones.length === 0 ? (
            <PortalEmptyPanel>
              <p className="text-sm text-muted-foreground">
                We&apos;re still shaping the plan. It&apos;ll appear here as soon as it&apos;s agreed.
              </p>
            </PortalEmptyPanel>
          ) : (
            <ol className="space-y-2">
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

        <div className="grid gap-5 lg:grid-cols-2">
          <PortalCard>
            <PortalSectionHeader id="deliverables" title="Files for this project" />
            {project.documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing shared yet. Deliverables will show up here as we finish them.
              </p>
            ) : (
              <ul className="space-y-2">
                {project.documents.map((document) => (
                  <li key={document.id}>
                    <a
                      href={portalDocumentHref(document.fileUrl)}
                      download
                      className="portal-link-row group"
                    >
                      <span className="portal-link-row__icon">
                        <FileText className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {document.name ?? portalDocumentName(document.fileUrl)}
                        </span>
                        <span className="block text-sm text-muted-foreground">v{document.version}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </PortalCard>

          <PortalCard>
            <PortalSectionHeader id="requests" title="Change requests" />
            {project.changeRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No changes have been requested on this project.
              </p>
            ) : (
              <ul className="space-y-2">
                {project.changeRequests.map((request) => (
                  <li key={request.id}>
                    <PortalLinkRow
                      href={`/portal/change-requests/${request.id}`}
                      title={request.title}
                      meta={`${request.reference} · updated ${formatRelativeDays(request.updatedAt)}`}
                      icon={GitPullRequestArrow}
                      trailing={<StatusBadge kind="changeRequestStatus" value={request.status} size="sm" />}
                    />
                  </li>
                ))}
              </ul>
            )}
          </PortalCard>
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
    <li className="portal-link-row !cursor-default !hover:shadow-none">
      <span
        aria-hidden="true"
        className={cn(
          "mt-1 size-2.5 shrink-0 rounded-full",
          done
            ? "bg-tone-positive"
            : approvalState.state === APPROVAL_STATE.CHANGES_REQUESTED
              ? "bg-tone-critical"
              : overdue
                ? "bg-tone-critical"
                : "bg-muted-foreground/40",
        )}
      />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className={cn("font-medium text-pretty", done && "text-muted-foreground")}>
            {milestone.title}
          </span>
          <StatusBadge kind="milestoneStatus" value={milestone.status} size="sm" />
        </span>

        {milestone.description ? (
          <p className="mt-1 text-sm text-pretty text-muted-foreground">{milestone.description}</p>
        ) : null}

        <p
          className={cn(
            "mt-1.5 text-xs",
            overdue ? "font-medium text-tone-critical-fg" : "text-muted-foreground",
          )}
        >
          {done && milestone.approvedAt
            ? `Signed off ${formatDate(milestone.approvedAt)}`
            : `Due ${formatDate(milestone.dueDate)}${overdue ? " · running late" : ""}`}
        </p>

        {milestone.requiresClientApproval &&
        approvalState.state !== APPROVAL_STATE.NOT_REQUIRED ? (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[oklch(0.96_0.015_255)] px-2.5 py-0.5 text-xs text-muted-foreground">
            {approvalState.label}
            {approvalState.waitingOn ? ` · ${approvalState.waitingOn}` : ""}
          </p>
        ) : null}
      </span>
    </li>
  );
}
