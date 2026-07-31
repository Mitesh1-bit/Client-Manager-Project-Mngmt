import Link from "next/link";
import { GitPullRequestArrow, Plus, TriangleAlert } from "lucide-react";

import { PageHeader } from "@/app/components/domain/page-header";
import { EmptyState } from "@/app/components/domain/states";
import { StatusBadge } from "@/app/components/domain/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { nextAction } from "@/app/lib/change-requests";
import { formatCurrency, formatRelativeDays, humanizeType } from "@/app/lib/format";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { PortalChangeRequestsDocument } from "@/app/lib/graphql/generated/documents";
import { cn } from "@/app/lib/utils";

export const metadata = { title: "Requests" };

export default async function PortalChangeRequestsPage() {
  const { data } = await getClient().query({ query: PortalChangeRequestsDocument });
  const requests = data.changeRequestQueue.nodes;
  const projects = data.projects.nodes;

  const needsYou = requests.filter((request) => request.awaitingParty === "CLIENT");

  return (
    <>
      <PageHeader
        title="Change requests"
        description="Anything you've asked us for outside the original plan, and where it's got to."
        actions={
          projects.length > 0 ? (
            <Button asChild>
              <Link href="/portal/change-requests/new">
                <Plus aria-hidden="true" />
                Request a change
              </Link>
            </Button>
          ) : null
        }
      />

      {requests.length === 0 ? (
        <EmptyState
          icon={GitPullRequestArrow}
          title="No requests yet"
          description="Need something outside the original plan — a new feature, a different date, more budget? Send us a request and we'll come back with the impact."
          action={
            projects.length > 0 ? (
              <Button asChild>
                <Link href="/portal/change-requests/new">
                  <Plus aria-hidden="true" />
                  Request a change
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {needsYou.length > 0 ? (
            <Alert className="border-tone-caution-border bg-tone-caution-bg text-tone-caution-fg">
              <TriangleAlert aria-hidden="true" />
              <AlertTitle>
                {needsYou.length === 1
                  ? "One request needs your decision"
                  : `${needsYou.length} requests need your decision`}
              </AlertTitle>
              <AlertDescription className="text-tone-caution-fg/90">
                We can&apos;t start the work until you approve or decline.
              </AlertDescription>
            </Alert>
          ) : null}

          <ul className="space-y-3">
            {requests.map((request) => (
              <li key={request.id}>
                <Link
                  href={`/portal/change-requests/${request.id}`}
                  className="group block rounded-2xl border bg-card p-4 transition-shadow hover:shadow-raised focus-ring sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="tabular text-caption text-muted-foreground">
                        {request.reference} · {humanizeType(request.type)}
                      </p>
                      <h2 className="mt-0.5 font-semibold text-pretty">{request.title}</h2>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                      <StatusBadge kind="changeRequestStatus" value={request.status} size="sm" />
                      {request.isOverdue ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-tone-critical px-2 py-0.5 text-[0.6875rem] font-medium text-white">
                          Overdue
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <p
                    className={cn(
                      "mt-2.5 text-caption",
                      request.awaitingParty === "CLIENT"
                        ? "font-medium text-tone-caution-fg"
                        : "text-muted-foreground",
                    )}
                  >
                    {nextAction(request, "CLIENT")}
                  </p>

                  <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[0.75rem] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <dt>Project</dt>
                      <dd className="font-medium text-foreground">{request.project.name}</dd>
                    </div>
                    {request.impactCost !== null && request.impactCost !== undefined ? (
                      <div className="flex items-center gap-1.5">
                        <dt>Cost</dt>
                        <dd className="tabular font-medium text-foreground">
                          {request.impactCost > 0 ? "+" : ""}
                          {formatCurrency(request.impactCost)}
                        </dd>
                      </div>
                    ) : null}
                    <div className="flex items-center gap-1.5">
                      <dt>Updated</dt>
                      <dd>{formatRelativeDays(request.updatedAt)}</dd>
                    </div>
                  </dl>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
