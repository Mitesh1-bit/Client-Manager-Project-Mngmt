"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { DataTable } from "@/app/components/domain/data-table";
import { PaginationBar } from "@/app/components/domain/pagination-bar";
import { StatusBadge } from "@/app/components/domain/status-badge";
import { TagList } from "@/app/components/domain/tag-list";
import { Progress } from "@/app/components/ui/progress";
import { formatCurrency, formatDate, formatRelativeDays, initials } from "@/app/lib/format";
import { buildListHref, sortToParams } from "@/app/lib/list-params";
import { parseDay, startOfDay } from "@/app/lib/project";
import { cn } from "@/app/lib/utils";

export function ProjectsTable({ connection, sort, emptyState }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const columns = useMemo(
    () => [
      {
        id: "name",
        header: "Project",
        meta: { width: "24rem" },
        cell: ({ row }) => (
          <div className="min-w-0">
            <Link
              href={`/projects/${row.original.id}`}
              className="block truncate font-medium hover:underline focus-ring rounded-sm"
            >
              {row.original.name}
            </Link>
            <p className="truncate text-caption text-muted-foreground">
              {row.original.company.name}
            </p>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge kind="projectStatus" value={row.original.status} size="sm" />
            <StatusBadge kind="projectHealth" value={row.original.health} size="sm" />
          </div>
        ),
      },
      {
        id: "completionPercent",
        header: "Progress",
        meta: { width: "9rem" },
        cell: ({ row }) => (
          <div className="w-28">
            <div className="mb-1 flex items-center justify-between text-caption">
              <span className="tabular font-medium">{row.original.completionPercent}%</span>
            </div>
            <Progress
              value={row.original.completionPercent}
              aria-label={`${row.original.name} is ${row.original.completionPercent}% complete`}
            />
          </div>
        ),
      },
      {
        id: "endDate",
        header: "Due",
        cell: ({ row }) => <DueCell project={row.original} />,
      },
      {
        id: "budget",
        header: "Budget",
        enableSorting: false,
        meta: { className: "text-right" },
        cell: ({ row }) => <BudgetCell project={row.original} />,
      },
      {
        id: "projectManager",
        header: "PM",
        enableSorting: false,
        cell: ({ row }) =>
          row.original.projectManager ? (
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[0.625rem] font-medium"
              >
                {initials(row.original.projectManager.name)}
              </span>
              <span className="truncate text-caption">{row.original.projectManager.name}</span>
            </span>
          ) : (
            <span className="text-caption text-muted-foreground">Unassigned</span>
          ),
      },
      {
        id: "tags",
        header: "Tags",
        enableSorting: false,
        cell: ({ row }) =>
          row.original.tags?.length ? (
            <TagList tags={row.original.tags} max={2} />
          ) : (
            <span className="text-caption text-muted-foreground">—</span>
          ),
      },
      {
        id: "updatedAt",
        header: "Updated",
        meta: { className: "text-right" },
        cell: ({ row }) => (
          <time
            dateTime={row.original.updatedAt}
            className="text-caption whitespace-nowrap text-muted-foreground"
          >
            {formatRelativeDays(row.original.updatedAt)}
          </time>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <DataTable
        data={connection.nodes}
        columns={columns}
        sort={sort}
        onSortChange={(next) =>
          router.push(buildListHref(pathname, searchParams, sortToParams(next)), { scroll: false })
        }
        getRowId={(row) => row.id}
        getRowHref={(row) => `/projects/${row.id}`}
        emptyState={emptyState}
        caption="Projects"
      />
      <PaginationBar
        pageInfo={connection.pageInfo}
        totalCount={connection.totalCount}
        itemLabel="projects"
      />
    </>
  );
}

function DueCell({ project }) {
  const end = parseDay(project.endDate);
  const live = project.status === "ACTIVE" || project.status === "PLANNING";
  const overdue = live && end && end < startOfDay(new Date());

  return (
    <div className="whitespace-nowrap">
      <p className={cn("text-caption font-medium", overdue && "text-tone-critical-fg")}>
        {formatDate(project.endDate)}
      </p>
      {end ? (
        <p className={cn("text-[0.75rem]", overdue ? "text-tone-critical-fg" : "text-muted-foreground")}>
          {overdue ? "overdue" : formatRelativeDays(project.endDate)}
        </p>
      ) : null}
    </div>
  );
}

function BudgetCell({ project }) {
  const over = project.budget ? project.actualCost > project.budget : false;
  const used = project.budget ? Math.round((project.actualCost / project.budget) * 100) : null;

  return (
    <div className="whitespace-nowrap">
      <p className={cn("tabular text-caption font-medium", over && "text-tone-critical-fg")}>
        {formatCurrency(project.actualCost, project.currency)}
      </p>
      <p className="tabular text-[0.75rem] text-muted-foreground">
        of {formatCurrency(project.budget, project.currency)}
        {used === null ? "" : ` · ${used}%`}
        {over ? <span className="sr-only"> — over budget</span> : null}
      </p>
    </div>
  );
}
