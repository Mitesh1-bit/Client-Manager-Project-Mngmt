import Link from "next/link";
import { ChevronRight, FolderOpen } from "lucide-react";

import { AwaitingYouBanner } from "@/app/components/domain/milestone-approval-panel";
import { PageHeader } from "@/app/components/domain/page-header";
import { EmptyState } from "@/app/components/domain/states";
import { StatusBadge } from "@/app/components/domain/status-badge";
import { Progress } from "@/app/components/ui/progress";
import {
  buildApprovalQueue,
  countAwaitingViewer,
  getMilestoneApprovalState,
} from "@/app/lib/approvals";
import { formatDate } from "@/app/lib/format";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { PortalProjectsDocument } from "@/app/lib/graphql/generated/documents";
import { requireViewer } from "@/app/lib/graphql/viewer";
import { parseDay, startOfDay } from "@/app/lib/project";
import { cn } from "@/app/lib/utils";

export const metadata = { title: "Projects" };

export default async function PortalProjectsPage() {
  const viewer = await requireViewer("PORTAL");
  const { data } = await getClient().query({ query: PortalProjectsDocument });

  const viewerName = viewer.contact?.fullName ?? null;
  const projects = data.projects.nodes;
  const awaiting = countAwaitingViewer(buildApprovalQueue(projects, viewerName));

  return (
    <>
      <PageHeader
        title="Your projects"
        description="Everything we're building for you, and how each one is tracking."
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="As soon as work kicks off, you'll be able to follow its progress here."
        />
      ) : (
        <div className="space-y-4">
          <AwaitingYouBanner count={awaiting} />

          <ul className="space-y-3">
            {projects.map((project) => {
              const needsYou = project.milestones.filter(
                (milestone) => getMilestoneApprovalState(milestone, viewerName).actionable,
              ).length;

              const nextMilestone = project.milestones
                .filter((milestone) => milestone.status !== "COMPLETED" && milestone.dueDate)
                .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];

              const endsAt = parseDay(project.endDate);
              const overdue =
                endsAt && project.status !== "COMPLETED" && endsAt < startOfDay(new Date());

              return (
                <li key={project.id}>
                  <Link
                    href={`/portal/projects/${project.id}`}
                    className="group block rounded-2xl border bg-card p-4 transition-shadow hover:shadow-raised focus-ring sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="font-semibold text-pretty">{project.name}</h2>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <StatusBadge kind="projectStatus" value={project.status} size="sm" />
                          <StatusBadge kind="projectHealth" value={project.health} size="sm" />
                          {needsYou > 0 ? (
                            <span className="inline-flex items-center rounded-full bg-tone-caution px-2 py-0.5 text-[0.6875rem] font-medium text-white">
                              {needsYou === 1 ? "Needs your approval" : `${needsYou} need you`}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <ChevronRight
                        aria-hidden="true"
                        className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                      />
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-caption">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="tabular font-medium">{project.completionPercent}%</span>
                      </div>
                      <Progress
                        value={project.completionPercent}
                        aria-label={`${project.name} is ${project.completionPercent}% complete`}
                        className="mt-1.5"
                      />
                    </div>

                    <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 text-caption">
                      <div className="flex items-center gap-1.5">
                        <dt className="text-muted-foreground">Target finish</dt>
                        <dd className={cn("font-medium", overdue && "text-tone-critical-fg")}>
                          {formatDate(project.endDate)}
                        </dd>
                      </div>
                      {nextMilestone ? (
                        <div className="flex min-w-0 items-center gap-1.5">
                          <dt className="shrink-0 text-muted-foreground">Next up</dt>
                          <dd className="truncate font-medium">{nextMilestone.title}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}
