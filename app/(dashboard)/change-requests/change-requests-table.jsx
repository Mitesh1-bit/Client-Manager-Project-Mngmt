"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Building2, Clock, TriangleAlert } from "lucide-react";

import { DataTable } from "@/app/components/domain/data-table";
import { PaginationBar } from "@/app/components/domain/pagination-bar";
import { StatusBadge } from "@/app/components/domain/status-badge";
import { formatCurrency, formatRelativeDays, humanizeType, initials } from "@/app/lib/format";
import { buildListHref, sortToParams } from "@/app/lib/list-params";
import { cn } from "@/app/lib/utils";

const AWAITING = {
  AGENCY: { label: "Us", icon: Building2, className: "text-tone-info-fg" },
  CLIENT: { label: "Client", icon: Clock, className: "text-tone-caution-fg" },
  NOBODY: { label: "—", icon: null, className: "text-muted-foreground" },
};

export function ChangeRequestsTable({ connection, sort, emptyState }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const columns = useMemo(
    () => [
      {
        id: "reference",
        header: "Request",
        meta: { width: "24rem" },
        cell: ({ row }) => (
          <div className="min-w-0">
            <Link
              href={`/change-requests/${row.original.id}`}
              className="flex min-w-0 items-center gap-2 focus-ring rounded-sm"
            >
              <span className="tabular shrink-0 text-caption text-muted-foreground">
                {row.original.reference}
              </span>
              <span className="truncate font-medium hover:underline">{row.original.title}</span>
            </Link>
            <p className="truncate text-caption text-muted-foreground">
              {row.original.company.name} · {row.original.project.name}
            </p>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge kind="changeRequestStatus" value={row.original.status} size="sm" />
            {row.original.isOverdue ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-tone-critical px-1.5 py-0.5 text-[0.6875rem] font-medium text-white">
                <TriangleAlert aria-hidden="true" className="size-3" />
                Overdue
              </span>
            ) : null}
          </div>
        ),
      },
      {
        id: "awaiting",
        header: "With",
        enableSorting: false,
        cell: ({ row }) => {
          const meta = AWAITING[row.original.awaitingParty] ?? AWAITING.NOBODY;
          const Icon = meta.icon;
          return (
            <span className={cn("flex items-center gap-1.5 text-caption", meta.className)}>
              {Icon ? <Icon aria-hidden="true" className="size-3.5" /> : null}
              {meta.label}
            </span>
          );
        },
      },
      {
        id: "type",
        header: "Type",
        cell: ({ row }) => (
          <span className="text-caption whitespace-nowrap">{humanizeType(row.original.type)}</span>
        ),
      },
      {
        id: "impact",
        header: "Impact",
        enableSorting: false,
        meta: { className: "text-right" },
        cell: ({ row }) => {
          const assessed =
            row.original.impactCost !== null && row.original.impactCost !== undefined;
          if (!assessed) {
            return <span className="text-caption text-muted-foreground">Not assessed</span>;
          }
          return (
            <div className="whitespace-nowrap">
              <p
                className={cn(
                  "tabular text-caption font-medium",
                  row.original.impactCost > 0 && "text-tone-caution-fg",
                  row.original.impactCost < 0 && "text-tone-positive-fg",
                )}
              >
                {row.original.impactCost > 0 ? "+" : ""}
                {formatCurrency(row.original.impactCost, row.original.project.currency)}
              </p>
              <p className="tabular text-[0.75rem] text-muted-foreground">
                {row.original.impactTimelineDays > 0 ? "+" : ""}
                {row.original.impactTimelineDays}d
              </p>
            </div>
          );
        },
      },
      {
        id: "priority",
        header: "Priority",
        cell: ({ row }) => <StatusBadge kind="priority" value={row.original.priority} size="sm" />,
      },
      {
        id: "assignedPm",
        header: "PM",
        enableSorting: false,
        cell: ({ row }) =>
          row.original.assignedPm ? (
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[0.625rem] font-medium"
              >
                {initials(row.original.assignedPm.name)}
              </span>
              <span className="truncate text-caption">{row.original.assignedPm.name}</span>
            </span>
          ) : (
            <span className="text-caption text-tone-caution-fg">Unassigned</span>
          ),
      },
      {
        id: "age",
        header: "Waiting",
        meta: { className: "text-right" },
        cell: ({ row }) => (
          <time
            dateTime={row.original.updatedAt}
            className={cn(
              "text-caption whitespace-nowrap",
              row.original.isOverdue ? "font-medium text-tone-critical-fg" : "text-muted-foreground",
            )}
          >
            {formatRelativeDays(row.original.updatedAt)}
          </time>
        ),
      },
    ],
    [],
  );

  return (
    <div data-tour="cr-table">
      <DataTable
        data={connection.nodes}
        columns={columns}
        sort={sort}
        onSortChange={(next) =>
          router.push(buildListHref(pathname, searchParams, sortToParams(next)), { scroll: false })
        }
        getRowId={(row) => row.id}
        getRowHref={(row) => `/change-requests/${row.id}`}
        emptyState={emptyState}
        caption="Change requests"
      />
      <PaginationBar
        pageInfo={connection.pageInfo}
        totalCount={connection.totalCount}
        itemLabel="change requests"
      />
    </div>
  );
}
