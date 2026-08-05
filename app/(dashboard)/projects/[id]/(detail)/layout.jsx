import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil } from "lucide-react";

import { DetailTabs } from "@/app/components/domain/detail-tabs";
import { StatusBadge } from "@/app/components/domain/status-badge";
import { TagList } from "@/app/components/domain/tag-list";
import { Button } from "@/app/components/ui/button";
import { Progress } from "@/app/components/ui/progress";
import { formatCurrency, formatDate, initials } from "@/app/lib/format";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { normalizeProject } from "@/app/lib/api/normalize";
import { pickList } from "@/app/lib/api/safe-list";
import { ProjectDetailHeaderDocument } from "@/app/lib/graphql/generated/documents";
import { parseDay, startOfDay } from "@/app/lib/project";
import { cn } from "@/app/lib/utils";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const { data } = await getClient().query({
    query: ProjectDetailHeaderDocument,
    variables: { id },
  });
  return { title: data.project?.name ?? "Project" };
}

export default async function ProjectDetailLayout({ children, params }) {
  const { id } = await params;
  const { data } = await getClient().query({
    query: ProjectDetailHeaderDocument,
    variables: { id },
  });

  const companiesById = new Map(pickList(data, "companies").map((company) => [company.id, company]));
  const usersById = new Map(pickList(data, "users").map((user) => [user.id, user]));
  const project = normalizeProject(data.project, usersById, companiesById);
  if (!project) notFound();

  const tabs = [
    { href: `/projects/${id}/board`, label: "Board" },
    { href: `/projects/${id}/list`, label: "List" },
    { href: `/projects/${id}/gantt`, label: "Timeline" },
    { href: `/projects/${id}/calendar`, label: "Calendar" },
    { href: `/projects/${id}/milestones`, label: "Milestones" },
    { href: `/projects/${id}/change-requests`, label: "Change requests" },
    { href: `/projects/${id}/documents`, label: "Documents" },
  ];

  const overBudget = project.budget ? project.actualCost > project.budget : false;
  const endsAt = parseDay(project.endDate);
  const live = project.status === "ACTIVE" || project.status === "PLANNING";
  const overdue = live && endsAt && endsAt < startOfDay(new Date());

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-4 flex items-center gap-1.5 text-caption text-muted-foreground">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1 rounded-sm hover:text-foreground focus-ring"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
            Projects
          </Link>
            {project.company ? (
              <>
                <span aria-hidden="true">/</span>
                <Link
                  href={`/companies/${project.company.id}`}
                  className="rounded-sm hover:text-foreground hover:underline focus-ring"
                >
                  {project.company.name}
                </Link>
              </>
            ) : null}
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-title text-balance">{project.name}</h1>
              <StatusBadge kind="projectStatus" value={project.status} />
              <StatusBadge kind="projectHealth" value={project.health} />
              <StatusBadge kind="priority" value={project.priority} size="sm" />
            </div>
            {project.description ? (
              <p className="mt-2 max-w-2xl text-caption text-pretty text-muted-foreground">
                {project.description}
              </p>
            ) : null}
            {(project.tags?.length ?? 0) > 0 ? <TagList tags={project.tags} className="mt-2.5" /> : null}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/projects/${id}/edit`}>
                <Pencil aria-hidden="true" />
                Edit
              </Link>
            </Button>
          </div>
        </div>

        {/* The at-a-glance strip: progress, dates, budget, who's on it. */}
        <dl data-tour="project-stats" className="mt-5 grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-caption text-muted-foreground">Progress</dt>
            <dd className="mt-1.5">
              <div className="flex items-center gap-2">
                <Progress
                  value={project.completionPercent}
                  aria-label={`${project.completionPercent}% complete`}
                  className="flex-1"
                />
                <span className="tabular text-caption font-medium">
                  {project.completionPercent}%
                </span>
              </div>
            </dd>
          </div>

          <div>
            <dt className="text-caption text-muted-foreground">Dates</dt>
            <dd className={cn("mt-1.5 text-caption font-medium", overdue && "text-tone-critical-fg")}>
              {formatDate(project.startDate)} – {formatDate(project.endDate)}
              {overdue ? <span className="ml-1.5 font-normal">(overdue)</span> : null}
            </dd>
          </div>

          <div>
            <dt className="text-caption text-muted-foreground">Budget</dt>
            <dd className="mt-1.5 text-caption font-medium">
              <span className={cn("tabular", overBudget && "text-tone-critical-fg")}>
                {formatCurrency(project.actualCost, project.currency)}
              </span>
              <span className="tabular font-normal text-muted-foreground">
                {" "}
                of {formatCurrency(project.budget, project.currency)}
              </span>
              {overBudget ? (
                <span className="ml-1.5 text-tone-critical-fg">over</span>
              ) : null}
            </dd>
          </div>

          <div>
            <dt className="text-caption text-muted-foreground">Team</dt>
            <dd className="mt-1.5 flex items-center gap-2">
              <ul className="flex -space-x-1.5">
                {(project.team ?? []).map((member) => (
                  <li key={member.id}>
                    <span
                      title={member.name}
                      className="flex size-7 items-center justify-center rounded-full border-2 border-card bg-muted text-[0.625rem] font-medium"
                    >
                      {initials(member.name)}
                      <span className="sr-only">{member.name}</span>
                    </span>
                  </li>
                ))}
              </ul>
              {project.projectManager ? (
                <span className="text-caption text-muted-foreground">
                  {project.projectManager.name} leads
                </span>
              ) : (
                <span className="text-caption text-tone-caution-fg">No PM assigned</span>
              )}
            </dd>
          </div>
        </dl>
      </div>

      <DetailTabs tabs={tabs} tourId="project-tabs" />

      {children}
    </div>
  );
}
