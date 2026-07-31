import Link from "next/link";
import { GitPullRequestArrow, Plus } from "lucide-react";

import { PageHeader } from "@/app/components/domain/page-header";
import { EmptyState } from "@/app/components/domain/states";
import { StatusBadge } from "@/app/components/domain/status-badge";
import { Button } from "@/app/components/ui/button";
import {
  normalizePortalChangeRequests,
  normalizePortalProjects,
} from "@/app/lib/api/portal";
import { formatRelativeDays, humanizeType } from "@/app/lib/format";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { PortalChangeRequestListDocument } from "@/app/lib/graphql/generated/documents";
import { requireViewer } from "@/app/lib/graphql/viewer";

export const metadata = { title: "Requests" };

export default async function PortalChangeRequestsPage() {
  await requireViewer("PORTAL");
  const { data } = await getClient().query({ query: PortalChangeRequestListDocument });
  const requests = normalizePortalChangeRequests(data.portalChangeRequests);
  const projects = normalizePortalProjects(data.portalProjects);
  const projectsById = new Map(projects.map((project) => [project.id, project]));

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
          description="Need something outside the original plan? Send us a request and we'll come back with the impact."
        />
      ) : (
        <ul className="space-y-3">
          {requests.map((request) => {
            const project = projectsById.get(request.project?.id ?? request.projectId);
            return (
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
                    <StatusBadge kind="changeRequestStatus" value={request.status} size="sm" />
                  </div>
                  {project ? (
                    <p className="mt-2 text-caption text-muted-foreground">Project: {project.name}</p>
                  ) : null}
                  <p className="mt-2 text-caption text-muted-foreground">
                    Updated {formatRelativeDays(request.updatedAt)}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
