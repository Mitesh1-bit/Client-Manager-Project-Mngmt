import { GitPullRequestArrow } from "lucide-react";

import { EmptyState } from "@/app/components/domain/states";
import { StatusBadge } from "@/app/components/domain/status-badge";
import { formatCurrency, formatRelativeDays, humanizeType } from "@/app/lib/format";
import { normalizeChangeRequest } from "@/app/lib/api/normalize";
import { getClient } from "@/app/lib/graphql/apollo-client";
import {
  ChangeRequestsByProjectDocument,
  ProjectDetailHeaderDocument,
} from "@/app/lib/graphql/generated/documents";
import { cn } from "@/app/lib/utils";

import { NewChangeRequestDialog } from "@/app/(dashboard)/change-requests/new-change-request-dialog";

export const metadata = { title: "Change requests" };

export default async function ProjectChangeRequestsPage({ params }) {
  const { id } = await params;
  const [{ data }, { data: header }] = await Promise.all([
    getClient().query({ query: ChangeRequestsByProjectDocument, variables: { projectId: id } }),
    getClient().query({ query: ProjectDetailHeaderDocument, variables: { id } }),
  ]);

  const requests = [...(data.changeRequests ?? [])]
    .map(normalizeChangeRequest)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const canCreate = Boolean(header.project?.canManage);
  const newRequestButton = canCreate ? (
    <NewChangeRequestDialog lockedProjectId={id} lockedProjectName={header.project?.name} />
  ) : null;

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={GitPullRequestArrow}
        title="No change requests"
        description="Nobody has asked to change the scope, timeline or budget of this project."
        action={newRequestButton}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">{newRequestButton}</div>
      <ul className="space-y-3">
        {requests.map((request) => (
          <li key={request.id} className="rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="tabular text-caption text-muted-foreground">
                    {request.reference}
                  </span>
                  <span className="font-medium text-pretty">{request.title}</span>
                </p>
                <p className="mt-1 text-caption text-muted-foreground">
                  {humanizeType(request.type)}
                  {request.requestedByContact
                    ? ` · raised by ${request.requestedByContact.fullName}`
                    : ""}
                  {request.assignedPm ? ` · assessed by ${request.assignedPm.name}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <StatusBadge kind="priority" value={request.priority} size="sm" />
                <StatusBadge kind="changeRequestStatus" value={request.status} size="sm" />
              </div>
            </div>

            <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-caption">
              <div className="flex items-center gap-1.5">
                <dt className="text-muted-foreground">Cost impact</dt>
                <dd
                  className={cn(
                    "tabular font-medium",
                    request.impactCost > 0 && "text-tone-caution-fg",
                    request.impactCost < 0 && "text-tone-positive-fg",
                  )}
                >
                  {request.impactCost === null || request.impactCost === undefined
                    ? "Not assessed"
                    : `${request.impactCost > 0 ? "+" : ""}${formatCurrency(request.impactCost)}`}
                </dd>
              </div>
              <div className="flex items-center gap-1.5">
                <dt className="text-muted-foreground">Timeline</dt>
                <dd className="tabular font-medium">
                  {request.impactTimelineDays === null || request.impactTimelineDays === undefined
                    ? "Not assessed"
                    : `${request.impactTimelineDays > 0 ? "+" : ""}${request.impactTimelineDays} days`}
                </dd>
              </div>
              <div className="flex items-center gap-1.5">
                <dt className="text-muted-foreground">Updated</dt>
                <dd>
                  <time dateTime={request.updatedAt}>{formatRelativeDays(request.updatedAt)}</time>
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
