import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, FolderKanban } from "lucide-react";

import { ListToolbar } from "@/app/components/domain/list-toolbar";
import { PaginationBar } from "@/app/components/domain/pagination-bar";
import { ErrorState } from "@/app/components/domain/states";
import { StatusBadge } from "@/app/components/domain/status-badge";
import { Progress } from "@/app/components/ui/progress";
import { filterList, paginateList } from "@/app/lib/api/connection";
import { normalizePortalProjects } from "@/app/lib/api/portal";
import { listStatuses } from "@/app/lib/status";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { PortalProjectsDocument } from "@/app/lib/graphql/generated/documents";
import { requireViewer } from "@/app/lib/graphql/viewer";
import { parseListParams, readList, readString } from "@/app/lib/list-params";

import { PortalCard, PortalEmptyPanel, PortalPageHeader } from "../portal-ui";

export const metadata = { title: "Projects" };

export default async function PortalProjectsPage({ searchParams }) {
  await requireViewer("PORTAL");
  const params = await searchParams;
  const query = readString(params, "q");
  const statusFilter = readList(params, "status");
  const healthFilter = readList(params, "health");
  const { pageInput } = parseListParams(params, { sortable: [], pageSize: 12 });

  let projects = [];
  let loadError = null;

  try {
    const { data } = await getClient().query({ query: PortalProjectsDocument });
    projects = normalizePortalProjects(data.portalProjects);
  } catch (error) {
    loadError = error;
    console.error("[portal projects] failed", error);
  }

  const filtered = filterList(projects, {
    query,
    searchFields: ["name", "description"],
    filters: {
      ...(statusFilter.length ? { status: statusFilter } : {}),
      ...(healthFilter.length ? { health: healthFilter } : {}),
    },
  });
  const { nodes, pageInfo, totalCount } = paginateList(filtered, pageInput);

  return (
    <>
      <PortalPageHeader
        eyebrow="Delivery"
        title="Your projects"
        description="Track progress, milestones, and shared files for each engagement."
      />

      {loadError ? (
        <ErrorState
          title="We couldn't load your projects"
          description={loadError?.message ?? "Try refreshing the page."}
        />
      ) : projects.length === 0 ? (
        <PortalEmptyPanel>
          <FolderKanban aria-hidden="true" className="mx-auto size-10 text-muted-foreground/50" />
          <h2 className="mt-4 text-lg font-semibold text-[#0a1550]">No projects yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Projects will appear here when your agency sets them up for your company.
          </p>
        </PortalEmptyPanel>
      ) : (
        <>
          <div className="mb-5">
            <Suspense fallback={null}>
              <ListToolbar
                searchPlaceholder="Search projects…"
                searchLabel="Search projects"
                filters={[
                  {
                    key: "status",
                    label: "Status",
                    options: listStatuses("projectStatus").map((item) => ({
                      value: item.value,
                      label: item.label,
                    })),
                  },
                  {
                    key: "health",
                    label: "Health",
                    options: listStatuses("projectHealth").map((item) => ({
                      value: item.value,
                      label: item.label,
                    })),
                  },
                ]}
              />
            </Suspense>
          </div>

          {nodes.length === 0 ? (
            <PortalEmptyPanel>
              <p className="text-sm text-muted-foreground">No projects match your search or filters.</p>
            </PortalEmptyPanel>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {nodes.map((project) => (
                <li key={project.id}>
                  <Link href={`/portal/projects/${project.id}`} className="block h-full focus-ring">
                    <PortalCard className="group flex h-full flex-col transition-all hover:shadow-[var(--portal-shadow-hover)] hover:-translate-y-0.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[oklch(0.96_0.015_255)] text-[#1e3a8a]">
                          <FolderKanban aria-hidden="true" className="size-5" />
                        </div>
                        <ChevronRight
                          aria-hidden="true"
                          className="size-5 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-[#1e3a8a]"
                        />
                      </div>
                      <h2 className="mt-4 font-mkt-display text-lg font-semibold tracking-tight text-[#0a1550] text-pretty">
                        {project.name}
                      </h2>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <StatusBadge kind="projectStatus" value={project.status} size="sm" />
                        <StatusBadge kind="projectHealth" value={project.health} size="sm" />
                      </div>
                      <div className="mt-4">
                        <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span className="tabular font-semibold text-[#0a1550]">
                            {project.completionPercent}%
                          </span>
                        </div>
                        <Progress value={project.completionPercent} className="h-2" />
                      </div>
                    </PortalCard>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <Suspense fallback={null}>
            <PaginationBar pageInfo={pageInfo} totalCount={totalCount} itemLabel="projects" />
          </Suspense>
        </>
      )}
    </>
  );
}
