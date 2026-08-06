import { Suspense } from "react";
import Link from "next/link";
import { GitPullRequestArrow, Plus } from "lucide-react";

import { ListToolbar } from "@/app/components/domain/list-toolbar";
import { PaginationBar } from "@/app/components/domain/pagination-bar";
import { StatusBadge } from "@/app/components/domain/status-badge";
import { Button } from "@/app/components/ui/button";
import { filterList, paginateList } from "@/app/lib/api/connection";
import {
  normalizePortalChangeRequests,
  normalizePortalProjects,
} from "@/app/lib/api/portal";
import { formatRelativeDays, humanizeType } from "@/app/lib/format";
import { listStatuses } from "@/app/lib/status";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { PortalChangeRequestListDocument } from "@/app/lib/graphql/generated/documents";
import { requireViewer } from "@/app/lib/graphql/viewer";
import { parseListParams, readList, readString } from "@/app/lib/list-params";

import { PortalCard, PortalEmptyPanel, PortalPageHeader } from "../portal-ui";

export const metadata = { title: "Requests" };

export default async function PortalChangeRequestsPage({ searchParams }) {
  await requireViewer("PORTAL");
  const params = await searchParams;
  const query = readString(params, "q");
  const statusFilter = readList(params, "status");
  const projectFilter = readString(params, "project");
  const { pageInput } = parseListParams(params, { sortable: [], pageSize: 10 });

  const { data } = await getClient().query({ query: PortalChangeRequestListDocument });
  const requests = normalizePortalChangeRequests(data.portalChangeRequests);
  const projects = normalizePortalProjects(data.portalProjects);
  const projectsById = new Map(projects.map((project) => [project.id, project]));

  const filtered = filterList(requests, {
    query,
    searchFields: ["title", "reference", "description"],
    filters: {
      ...(statusFilter.length ? { status: statusFilter } : {}),
      ...(projectFilter ? { projectId: [projectFilter] } : {}),
    },
  });
  const { nodes, pageInfo, totalCount } = paginateList(filtered, pageInput);

  const projectFilterOptions = projects.map((project) => ({
    value: project.id,
    label: project.name,
  }));

  return (
    <>
      <PortalPageHeader
        eyebrow="Scope changes"
        title="Change requests"
        description="Anything you've asked us for outside the original plan, and where it's got to."
        actions={
          projects.length > 0 ? (
            <Button className="bg-[#0a1550] hover:bg-[#1e3a8a]" asChild data-tour="portal-new-request-btn">
              <Link href="/portal/change-requests/new">
                <Plus aria-hidden="true" />
                Request a change
              </Link>
            </Button>
          ) : null
        }
      />

      {requests.length === 0 ? (
        <PortalEmptyPanel>
          <GitPullRequestArrow aria-hidden="true" className="mx-auto size-10 text-muted-foreground/50" />
          <h2 className="mt-4 text-lg font-semibold text-[#0a1550]">No requests yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Need something outside the original plan? Submit a change request and we&apos;ll assess the
            impact.
          </p>
          {projects.length > 0 ? (
            <Button className="mt-5 bg-[#0a1550] hover:bg-[#1e3a8a]" asChild>
              <Link href="/portal/change-requests/new">
                <Plus aria-hidden="true" />
                Request a change
              </Link>
            </Button>
          ) : null}
        </PortalEmptyPanel>
      ) : (
        <>
          <div className="mb-5">
            <Suspense fallback={null}>
              <ListToolbar
                searchPlaceholder="Search requests…"
                searchLabel="Search change requests"
                filters={[
                  {
                    key: "status",
                    label: "Status",
                    options: listStatuses("changeRequestStatus").map((item) => ({
                      value: item.value,
                      label: item.label,
                    })),
                  },
                  ...(projectFilterOptions.length > 1
                    ? [
                        {
                          key: "project",
                          label: "Project",
                          multi: false,
                          allLabel: "All projects",
                          options: projectFilterOptions,
                        },
                      ]
                    : []),
                ]}
              />
            </Suspense>
          </div>

          {nodes.length === 0 ? (
            <PortalEmptyPanel>
              <p className="text-sm text-muted-foreground">No requests match your search or filters.</p>
            </PortalEmptyPanel>
          ) : (
            <ul className="space-y-3">
              {nodes.map((request) => {
                const project = projectsById.get(request.project?.id ?? request.projectId);
                return (
                  <li key={request.id}>
                    <Link href={`/portal/change-requests/${request.id}`} className="block focus-ring">
                      <PortalCard className="transition-all hover:shadow-[var(--portal-shadow-hover)] hover:-translate-y-0.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="tabular text-xs font-medium text-muted-foreground">
                              {request.reference} · {humanizeType(request.type)}
                            </p>
                            <h2 className="mt-1 font-mkt-display text-lg font-semibold tracking-tight text-[#0a1550] text-pretty">
                              {request.title}
                            </h2>
                          </div>
                          <StatusBadge kind="changeRequestStatus" value={request.status} size="sm" />
                        </div>
                        {project ? (
                          <p className="mt-2 text-sm text-muted-foreground">Project: {project.name}</p>
                        ) : null}
                        <p className="mt-2 text-sm text-muted-foreground">
                          Updated {formatRelativeDays(request.updatedAt)}
                        </p>
                      </PortalCard>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <Suspense fallback={null}>
            <PaginationBar pageInfo={pageInfo} totalCount={totalCount} itemLabel="requests" />
          </Suspense>
        </>
      )}
    </>
  );
}
