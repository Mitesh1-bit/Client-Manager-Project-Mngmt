"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FolderKanban, GitPullRequestArrow, Users } from "lucide-react";

import { DataTable } from "@/app/components/domain/data-table";
import { EntityAvatar } from "@/app/components/domain/entity-avatar";
import { HealthScoreBadge } from "@/app/components/domain/health-score-badge";
import { PaginationBar } from "@/app/components/domain/pagination-bar";
import { StatusBadge } from "@/app/components/domain/status-badge";
import { TagList } from "@/app/components/domain/tag-list";
import { formatRelativeDays, initials } from "@/app/lib/format";
import { buildListHref, sortToParams } from "@/app/lib/list-params";

export function CompaniesTable({ connection, sort, emptyState }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const columns = useMemo(
    () => [
      {
        id: "name",
        header: "Client",
        meta: { width: "26rem" },
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <EntityAvatar
              name={row.original.name}
              imageUrl={row.original.logoUrl}
              kind="company"
              size="sm"
            />
            <div className="min-w-0">
              <Link
                href={`/companies/${row.original.id}`}
                className="block truncate font-medium hover:underline focus-ring rounded-sm"
              >
                {row.original.name}
              </Link>
              <p className="truncate text-caption text-muted-foreground">
                {row.original.industry ?? "No industry"}
                {row.original.primaryContact ? ` · ${row.original.primaryContact.fullName}` : ""}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge kind="companyStatus" value={row.original.status} size="sm" />,
      },
      {
        id: "healthScore",
        header: "Health",
        cell: ({ row }) => (
          <HealthScoreBadge
            score={row.original.healthScore}
            history={(row.original.healthScoreTrend ?? []).map((point) => point.score)}
            size="sm"
            showSparkline={false}
          />
        ),
      },
      {
        id: "accountOwner",
        header: "Owner",
        enableSorting: false,
        cell: ({ row }) =>
          row.original.accountOwner ? (
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[0.625rem] font-medium"
              >
                {initials(row.original.accountOwner.name)}
              </span>
              <span className="truncate text-caption">{row.original.accountOwner.name}</span>
            </span>
          ) : (
            <span className="text-caption text-muted-foreground">Unassigned</span>
          ),
      },
      {
        id: "counts",
        header: "Activity",
        enableSorting: false,
        cell: ({ row }) => (
          <dl className="flex items-center gap-3 text-caption text-muted-foreground">
            <div className="flex items-center gap-1" title="Contacts">
              <dt className="sr-only">Contacts</dt>
              <Users aria-hidden="true" className="size-3.5" />
              <dd className="tabular">{row.original.contactCount}</dd>
            </div>
            <div className="flex items-center gap-1" title="Projects">
              <dt className="sr-only">Projects</dt>
              <FolderKanban aria-hidden="true" className="size-3.5" />
              <dd className="tabular">{row.original.projectCount}</dd>
            </div>
            {row.original.openChangeRequestCount > 0 ? (
              <div
                className="flex items-center gap-1 text-tone-caution-fg"
                title="Open change requests"
              >
                <dt className="sr-only">Open change requests</dt>
                <GitPullRequestArrow aria-hidden="true" className="size-3.5" />
                <dd className="tabular">{row.original.openChangeRequestCount}</dd>
              </div>
            ) : null}
          </dl>
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

  function handleSortChange(next) {
    router.push(buildListHref(pathname, searchParams, sortToParams(next)), { scroll: false });
  }

  return (
    <>
      <DataTable
        data={connection?.nodes ?? []}
        columns={columns}
        sort={sort}
        onSortChange={handleSortChange}
        getRowId={(row) => row.id}
        getRowHref={(row) => `/companies/${row.id}`}
        emptyState={emptyState}
        caption="Clients"
      />
      <PaginationBar
        pageInfo={connection.pageInfo}
        totalCount={connection.totalCount}
        itemLabel="clients"
      />
    </>
  );
}
