import Link from "next/link";
import { ChevronRight, FolderOpen } from "lucide-react";

import { PageHeader } from "@/app/components/domain/page-header";
import { EmptyState } from "@/app/components/domain/states";
import { StatusBadge } from "@/app/components/domain/status-badge";
import { normalizePortalProjects } from "@/app/lib/api/portal";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { PortalProjectsDocument } from "@/app/lib/graphql/generated/documents";
import { requireViewer } from "@/app/lib/graphql/viewer";

export const metadata = { title: "Projects" };

export default async function PortalProjectsPage() {
  await requireViewer("PORTAL");
  const { data } = await getClient().query({ query: PortalProjectsDocument });
  const projects = normalizePortalProjects(data.portalProjects);

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
        <ul className="space-y-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/portal/projects/${project.id}`}
                className="group flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 transition-shadow hover:shadow-raised focus-ring sm:p-5"
              >
                <div className="min-w-0">
                  <h2 className="font-semibold text-pretty">{project.name}</h2>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <StatusBadge kind="projectStatus" value={project.status} size="sm" />
                    <StatusBadge kind="projectHealth" value={project.health} size="sm" />
                  </div>
                </div>
                <ChevronRight
                  aria-hidden="true"
                  className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
