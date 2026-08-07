import { notFound } from "next/navigation";
import { GitPullRequestArrow } from "lucide-react";

import { fetchChangeRequestQueue } from "@/app/lib/api/change-requests";
import { asArray } from "@/app/lib/api/safe-list";
import { EmptyState } from "@/app/components/domain/states";
import { StatusBadge } from "@/app/components/domain/status-badge";
import { formatCurrency, formatRelativeDays, humanizeType } from "@/app/lib/format";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { CompanyDetailHeaderDocument } from "@/app/lib/graphql/generated/documents";
import { cn } from "@/app/lib/utils";

export const metadata = { title: "Change log" };

export default async function CompanyChangeLogPage({ params }) {
  const { id } = await params;
  const { data } = await getClient().query({
    query: CompanyDetailHeaderDocument,
    variables: { id },
  });

  if (!data.company) notFound();

  const { rows = [] } = await fetchChangeRequestQueue().catch((error) => {
    console.error("[company change-log]", error);
    return { rows: [] };
  });
  const requests = asArray(rows)
    .filter((request) => request.companyId === id)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={GitPullRequestArrow}
        title="No change requests"
        description={`${data.company.name} hasn't asked for any changes to scope, timeline or budget.`}
      />
    );
  }

  return (
    <ul data-tour="company-change-log" className="space-y-3">
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
                {humanizeType(request.type)} on {request.project?.name ?? "Project"}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <StatusBadge kind="priority" value={request.priority?.toUpperCase()} size="sm" />
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
  );
}
