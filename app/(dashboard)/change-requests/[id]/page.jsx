import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, FileText, XCircle } from "lucide-react";

import { BackLink } from "@/app/components/domain/back-link";

import { ChangeRequestDecisionPanel } from "@/app/components/domain/change-request-decision-panel";
import { ChangeRequestStatusPanel } from "@/app/components/domain/change-request-status-panel";
import { ChangeRequestTimeline } from "@/app/components/domain/change-request-timeline";
import { CommentThread } from "@/app/components/domain/comment-thread";
import { EntityAvatar } from "@/app/components/domain/entity-avatar";
import { SectionCard } from "@/app/components/domain/states";
import { StatusBadge } from "@/app/components/domain/status-badge";
import { formatBytes, formatDate, humanizeType } from "@/app/lib/format";
import { normalizeChangeRequest, toUiStatus } from "@/app/lib/api/normalize";
import { asArray, pickList } from "@/app/lib/api/safe-list";
import { getSessionClaims } from "@/app/lib/auth/session";
import { getClient } from "@/app/lib/graphql/apollo-client";
import {
  ChangeRequestDetailDocument,
  ChangeRequestFormOptionsDocument,
  ChangeRequestTaskOptionsDocument,
} from "@/app/lib/graphql/generated/documents";

import { AssessmentPanel } from "./assessment-panel";
import { ChangeRequestActions } from "./change-request-actions";
import { CreateTaskFromChangeRequestDialog } from "./create-task-dialog";

// Once it's agreed and either building or about to start, a PM can spin work
// off it. Before Approved there's nothing agreed to build yet; after
// Implemented/Closed the work this request was for is already done.
const TASK_CREATABLE_STATUSES = ["APPROVED", "IN_PROGRESS"];
const TASK_CREATOR_ROLES = ["admin", "project_manager"];

export async function generateMetadata({ params }) {
  const { id } = await params;
  const { data } = await getClient().query({ query: ChangeRequestDetailDocument, variables: { id } });
  const cr = normalizeChangeRequest(data.changeRequest);
  if (!cr) return { title: "Change request" };
  return { title: `${cr.reference} · ${cr.title}` };
}

export default async function ChangeRequestDetailPage({ params }) {
  const { id } = await params;

  const [{ data }, { data: options }] = await Promise.all([
    getClient().query({ query: ChangeRequestDetailDocument, variables: { id } }),
    getClient().query({ query: ChangeRequestFormOptionsDocument }),
  ]);

  const request = normalizeChangeRequest(data.changeRequest);
  if (!request) notFound();

  const threshold = data.me?.organization?.settings?.changeRequestInternalApprovalThresholdCost ?? 0;
  const company = data.companies?.find((candidate) => candidate.id === request.companyId);
  const project = data.projects?.find((candidate) => candidate.id === request.projectId);
  // Cost impact is billed in whatever the project itself is billed in, same
  // rule contracts already inherit — there's no separate currency on a CR.
  request.currency = project?.currency ?? "GBP";

  const claims = await getSessionClaims();
  const canCreateTask =
    TASK_CREATOR_ROLES.includes(claims?.role) && TASK_CREATABLE_STATUSES.includes(request.status);
  let phases = [];
  if (canCreateTask) {
    const { data: taskOptions } = await getClient().query({
      query: ChangeRequestTaskOptionsDocument,
      variables: { projectId: request.projectId },
    });
    phases = asArray(taskOptions?.project?.phases);
  }
  const linkedTasks = asArray(request.tasks);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <BackLink href="/change-requests">Change requests</BackLink>

      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="tabular text-caption text-muted-foreground">{request.reference}</p>
          <h1 className="mt-0.5 text-title text-balance">{request.title}</h1>
          <p className="mt-1.5 text-caption text-muted-foreground">
            {company ? (
              <Link
                href={`/companies/${company.id}`}
                className="rounded-sm hover:text-foreground hover:underline focus-ring"
              >
                {company.name}
              </Link>
            ) : null}
            {company && project ? " · " : ""}
            {project ? (
              <Link
                href={`/projects/${project.id}/board`}
                className="rounded-sm hover:text-foreground hover:underline focus-ring"
              >
                {project.name}
              </Link>
            ) : null}
            {" · "}
            {humanizeType(request.type)}
          </p>
        </div>

        {request.status !== "CLOSED" ? (
          <ChangeRequestActions request={request} users={pickList(options, "users")} />
        ) : null}
      </header>

      {request.status === "CLOSED" && request.decisionReason?.startsWith("Withdrawn") ? (
        <div className="mb-5 flex items-center gap-2.5 rounded-2xl border bg-muted/50 px-4 py-3 text-caption text-muted-foreground">
          <XCircle aria-hidden="true" className="size-4 shrink-0" />
          Withdrawn by the client{request.decisionReason ? `: ${request.decisionReason}` : ""}
        </div>
      ) : null}

      <div className="space-y-5">
        <div data-tour="cr-status-panel">
          <ChangeRequestStatusPanel request={request} audience="INTERNAL" />
        </div>

        {request.description ? (
          <SectionCard data-tour="cr-description" title="What was asked for">
            <p className="text-caption text-pretty">{request.description}</p>
          </SectionCard>
        ) : null}

        <div data-tour="cr-assessment">
          <AssessmentPanel request={request} threshold={threshold} />
        </div>

        {canCreateTask || linkedTasks.length > 0 ? (
          <SectionCard
            data-tour="cr-linked-tasks"
            title="Linked tasks"
            description="Work created on the project board from this request."
            actions={
              canCreateTask ? (
                <CreateTaskFromChangeRequestDialog
                  request={request}
                  projectId={request.projectId}
                  phases={phases}
                  users={pickList(options, "users")}
                />
              ) : null
            }
          >
            {linkedTasks.length === 0 ? (
              <p className="text-caption text-muted-foreground">
                No tasks created from this request yet.
              </p>
            ) : (
              <ul className="divide-y rounded-xl border">
                {linkedTasks.map((task) => (
                  <li key={task.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <EntityAvatar name={task.assignee?.name ?? "Unassigned"} size="sm" />
                      <div className="min-w-0">
                        <Link
                          href={`/projects/${request.projectId}/board`}
                          className="truncate font-medium hover:underline focus-ring rounded-sm"
                        >
                          {task.title}
                        </Link>
                        <p className="truncate text-caption text-muted-foreground">
                          {task.assignee?.name ?? "Unassigned"}
                        </p>
                      </div>
                    </div>
                    <StatusBadge kind="taskStatus" value={toUiStatus("taskStatus", task.status)} size="sm" />
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        ) : null}

        {/* Renders the decide-now form when internal sign-off is outstanding,
            otherwise falls back to decision history if there is any. */}
        <div data-tour="cr-decision">
          <ChangeRequestDecisionPanel request={request} approverType="INTERNAL" />
        </div>

        {request.attachments.length > 0 ? (
          <SectionCard data-tour="cr-attachments" title="Attachments">
            <ul className="space-y-1.5">
              {request.attachments.map((attachment) => (
                <li key={attachment.id}>
                  <a
                    href={attachment.fileUrl}
                    download
                    className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-colors hover:bg-accent focus-ring"
                  >
                    <FileText aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-caption font-medium">
                        {attachment.name}
                      </span>
                      <span className="block text-[0.75rem] text-muted-foreground">
                        {formatBytes(attachment.sizeBytes)} · {formatDate(attachment.createdAt)}
                      </span>
                    </span>
                    <Download aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                  </a>
                </li>
              ))}
            </ul>
          </SectionCard>
        ) : null}

        <SectionCard data-tour="cr-history" title="History">
          <ChangeRequestTimeline request={request} />
        </SectionCard>

        <div data-tour="cr-comments">
          <CommentThread
            entityType="CHANGE_REQUEST"
            entityId={request.id}
            comments={request.comments}
            audience="INTERNAL"
          />
        </div>
      </div>
    </div>
  );
}
