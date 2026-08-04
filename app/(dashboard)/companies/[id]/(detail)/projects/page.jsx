import { notFound } from "next/navigation";
import { FolderKanban } from "lucide-react";

import { EmptyState } from "@/app/components/domain/states";
import { StatusBadge } from "@/app/components/domain/status-badge";
import { Progress } from "@/app/components/ui/progress";
import { formatCurrency, formatDate, initials } from "@/app/lib/format";
import { normalizeProject } from "@/app/lib/api/normalize";
import { asArray } from "@/app/lib/api/safe-list";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { CompanyProjectsDocument } from "@/app/lib/graphql/generated/documents";
import { cn } from "@/app/lib/utils";

export const metadata = { title: "Projects" };

export default async function CompanyProjectsPage({ params }) {
  const { id } = await params;
  const { data } = await getClient().query({
    query: CompanyProjectsDocument,
    variables: { id },
  });

  if (!data.company) notFound();
  const projects = asArray(data.projects).map((project) => normalizeProject(project));

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="No projects yet"
        description={`Nothing is in flight for ${data.company.name}. Projects created for this company will appear here.`}
      />
    );
  }

  return (
    <div data-tour="company-projects-list" className="grid gap-4 lg:grid-cols-2">
      {projects.map((project) => {
        const overBudget = project.budget && project.actualCost > project.budget;

        return (
          <article key={project.id} className="rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-subheading text-balance">{project.name}</h2>
              <StatusBadge kind="projectHealth" value={project.health} size="sm" />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge kind="projectStatus" value={project.status} size="sm" />
              <StatusBadge kind="priority" value={project.priority} size="sm" />
              {project.projectManager ? (
                <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
                  <span
                    aria-hidden="true"
                    className="flex size-5 items-center justify-center rounded-full bg-muted text-[0.5625rem] font-medium"
                  >
                    {initials(project.projectManager.name)}
                  </span>
                  {project.projectManager.name}
                </span>
              ) : null}
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-caption">
                <span className="text-muted-foreground">Progress</span>
                <span className="tabular font-medium">{project.completionPercent}%</span>
              </div>
              <Progress
                value={project.completionPercent}
                aria-label={`${project.name} progress`}
                className="mt-1.5"
              />
            </div>

            <dl className="mt-4 grid grid-cols-3 gap-3 text-caption">
              <div>
                <dt className="text-muted-foreground">Dates</dt>
                <dd className="mt-0.5 font-medium">
                  {formatDate(project.startDate)} – {formatDate(project.endDate)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Budget</dt>
                <dd className="mt-0.5 font-medium">{formatCurrency(project.budget, project.currency)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Spent</dt>
                <dd className={cn("mt-0.5 font-medium", overBudget && "text-tone-critical-fg")}>
                  {formatCurrency(project.actualCost, project.currency)}
                  {overBudget ? <span className="sr-only"> — over budget</span> : null}
                </dd>
              </div>
            </dl>
          </article>
        );
      })}
    </div>
  );
}
