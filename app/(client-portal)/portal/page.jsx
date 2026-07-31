import Link from "next/link";
import { FolderOpen } from "lucide-react";

import { PageHeader } from "@/app/components/domain/page-header";
import { EmptyState, ErrorState } from "@/app/components/domain/states";
import { StatusBadge } from "@/app/components/domain/status-badge";
import { Button } from "@/app/components/ui/button";
import { normalizePortalProjects } from "@/app/lib/api/portal";
import { getClient } from "@/app/lib/graphql/apollo-client";
import {
  PortalApprovalsDocument,
  PortalProjectsDocument,
} from "@/app/lib/graphql/generated/documents";
import { requireViewer } from "@/app/lib/graphql/viewer";

export const metadata = { title: "Overview" };

export default async function PortalOverviewPage() {
  const viewer = await requireViewer("PORTAL");
  const companyName = viewer.company?.name ?? "your company";

  let projects = [];
  let projectsError = null;
  let pendingApprovals = [];

  try {
    const { data } = await getClient().query({ query: PortalProjectsDocument });
    projects = normalizePortalProjects(data.portalProjects);
  } catch (error) {
    projectsError = error;
    console.error("[portal overview] portalProjects failed", error);
  }

  try {
    const { data } = await getClient().query({ query: PortalApprovalsDocument });
    pendingApprovals = data.portalPendingApprovals ?? [];
  } catch (error) {
    console.error("[portal overview] portalPendingApprovals failed", error);
  }

  return (
    <>
      <PageHeader
        title={`Hello, ${viewer.name.split(" ")[0]}`}
        description={`Everything we're building for ${companyName}, and anything waiting on your input.`}
      />

      {projectsError ? (
        <ErrorState
          title="We couldn't load your projects"
          description={projectsError?.message ?? "The request to the API failed. Try again."}
        />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description={`We don't see any active projects linked to ${companyName} yet. Ask your project manager to create one for this company, then refresh this page.`}
        />
      ) : (
        <div className="space-y-6">
          {pendingApprovals.length > 0 ? (
            <section className="rounded-2xl border bg-card p-4 sm:p-5">
              <h2 className="text-subheading">Pending approvals</h2>
              <p className="mt-1 text-caption text-muted-foreground">
                {pendingApprovals.length} item
                {pendingApprovals.length === 1 ? "" : "s"} waiting on review.
              </p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link href="/portal/approvals">View approvals</Link>
              </Button>
            </section>
          ) : null}

          <section aria-labelledby="your-projects">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="your-projects" className="text-subheading">
                Your projects
              </h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/portal/projects">View all</Link>
              </Button>
            </div>
            <ul className="grid gap-3 lg:grid-cols-2">
              {projects.slice(0, 4).map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/portal/projects/${project.id}`}
                    className="block h-full rounded-2xl border bg-card p-4 transition-shadow hover:shadow-raised focus-ring"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-pretty">{project.name}</h3>
                      <StatusBadge kind="projectHealth" value={project.health} size="sm" />
                    </div>
                    <StatusBadge kind="projectStatus" value={project.status} size="sm" className="mt-2" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </>
  );
}
