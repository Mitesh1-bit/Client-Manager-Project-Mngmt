import Link from "next/link";
import { ArrowRight, FolderOpen, GitPullRequestArrow } from "lucide-react";

import {
  AwaitingYouBanner,
  MilestoneApprovalPanel,
} from "@/app/components/domain/milestone-approval-panel";
import { PageHeader } from "@/app/components/domain/page-header";
import { EmptyState, ErrorState } from "@/app/components/domain/states";
import { StatusBadge } from "@/app/components/domain/status-badge";
import { Button } from "@/app/components/ui/button";
import { Progress } from "@/app/components/ui/progress";
import { buildApprovalQueue } from "@/app/lib/approvals";
import { formatDate, formatRelativeDays } from "@/app/lib/format";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { PortalOverviewDocument } from "@/app/lib/graphql/generated/documents";
import { requireViewer } from "@/app/lib/graphql/viewer";
import { parseDay, startOfDay } from "@/app/lib/project";
import { cn } from "@/app/lib/utils";

export const metadata = { title: "Overview" };

export default async function PortalOverviewPage() {
  const viewer = await requireViewer("PORTAL");

  let overview = null;
  try {
    const { data } = await getClient().query({ query: PortalOverviewDocument });
    overview = data;
  } catch {
    overview = null;
  }

  const viewerName = viewer.contact?.fullName ?? null;
  const queue = overview ? buildApprovalQueue(overview.projects.nodes, viewerName) : [];
  const awaitingYou = queue.filter((item) => item.approvalState.actionable);

  return (
    <>
      <PageHeader
        title={`Hello, ${viewer.name.split(" ")[0]}`}
        description="Everything we're building for you, and anything waiting on your input."
      />

      {!overview ? (
        <ErrorState />
      ) : overview.projects.nodes.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="Once your engagement is set up, your projects and their progress will appear here."
        />
      ) : (
        <div className="space-y-6">
          {/* What needs this person, first and unmissable. */}
          {awaitingYou.length > 0 ? (
            <section aria-labelledby="needs-you" className="space-y-4">
              <AwaitingYouBanner count={awaitingYou.length} />
              <h2 id="needs-you" className="sr-only">
                Waiting on you
              </h2>
              {awaitingYou.slice(0, 2).map((item) => (
                <MilestoneApprovalPanel
                  key={item.key}
                  milestone={item.milestone}
                  viewerName={viewerName}
                  projectName={item.project.name}
                />
              ))}
              {awaitingYou.length > 2 ? (
                <Button variant="outline" asChild>
                  <Link href="/portal/approvals">
                    See all {awaitingYou.length} approvals
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              ) : null}
            </section>
          ) : (
            <section className="rounded-2xl border bg-card p-4 sm:p-5">
              <h2 className="text-subheading">Nothing needs you right now</h2>
              <p className="mt-1 text-caption text-muted-foreground">
                We&apos;ll email you and put it here the moment something needs your sign-off.
              </p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link href="/portal/approvals">See approval history</Link>
              </Button>
            </section>
          )}

          <section aria-labelledby="your-projects">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="your-projects" className="text-subheading">
                Your projects
              </h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/portal/projects">
                  View all
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>

            <ul className="grid gap-3 lg:grid-cols-2">
              {overview.projects.nodes.slice(0, 4).map((project) => {
                const endsAt = parseDay(project.endDate);
                const overdue =
                  endsAt && project.status !== "COMPLETED" && endsAt < startOfDay(new Date());

                return (
                  <li key={project.id}>
                    <Link
                      href={`/portal/projects/${project.id}`}
                      className="block h-full rounded-2xl border bg-card p-4 transition-shadow hover:shadow-raised focus-ring"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-pretty">{project.name}</h3>
                        <StatusBadge kind="projectHealth" value={project.health} size="sm" />
                      </div>

                      <div className="mt-3 flex items-center justify-between text-caption">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="tabular font-medium">{project.completionPercent}%</span>
                      </div>
                      <Progress
                        value={project.completionPercent}
                        aria-label={`${project.name} is ${project.completionPercent}% complete`}
                        className="mt-1.5"
                      />

                      <p
                        className={cn(
                          "mt-3 text-caption",
                          overdue ? "font-medium text-tone-critical-fg" : "text-muted-foreground",
                        )}
                      >
                        Target finish {formatDate(project.endDate)}
                        {overdue ? " · running late" : ""}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-labelledby="your-requests" className="rounded-2xl border bg-card p-4 sm:p-5">
            <h2 id="your-requests" className="text-subheading">
              Your recent requests
            </h2>
            {overview.changeRequests.length === 0 ? (
              <p className="mt-2 text-caption text-muted-foreground">
                You haven&apos;t raised any change requests yet.
              </p>
            ) : (
              <ul className="mt-3 divide-y">
                {overview.changeRequests.slice(0, 5).map((request) => (
                  <li key={request.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
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
      )}
    </>
  );
}
