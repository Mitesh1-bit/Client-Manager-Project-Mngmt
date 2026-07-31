"use client";

import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { cn } from "@/app/lib/utils";

/**
 * Server-driven table. TanStack Table handles column definition and rendering
 * only — sorting and pagination are GraphQL variables, so `manualSorting` and
 * `manualPagination` are on and the parent owns the state via the URL.
 *
 * Rows are navigable: clicking anywhere on a row follows `getRowHref`, and the
 * first cell carries a real anchor so keyboard and middle-click both work.
 *
 * @param {{
 *   data: unknown[],
 *   columns: unknown[],
 *   sort?: { id: string, desc: boolean } | null,
 *   onSortChange?: (sort: { id: string, desc: boolean } | null) => void,
 *   getRowHref?: (row: unknown) => string,
 *   getRowId?: (row: unknown) => string,
 *   emptyState?: React.ReactNode,
 *   caption?: string,
 * }} props
 */
export function DataTable({
  data,
  columns,
  sort = null,
  onSortChange,
  getRowHref,
  onRowClick,
  getRowId,
  emptyState,
  caption,
}) {
  const router = useRouter();

  // React Compiler skips memoizing this component: `useReactTable` returns
  // functions it can't safely memoize. That's fine — rows are re-rendered on
  // navigation anyway, and the page sizes here are small.
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    getRowId,
    state: { sorting: sort ? [sort] : [] },
  });

  if (data.length === 0 && emptyState) return emptyState;

  function toggleSort(column) {
    if (!onSortChange) return;
    if (sort?.id !== column.id) return onSortChange({ id: column.id, desc: false });
    if (!sort.desc) return onSortChange({ id: column.id, desc: true });
    return onSortChange(null);
  }

  return (
    <div className="relative overflow-x-auto rounded-xl border bg-card">
      <Table>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                const sortable = header.column.columnDef.enableSorting !== false && onSortChange;
                const active = sort?.id === header.column.id;
                const label = flexRender(
                  header.column.columnDef.header,
                  header.getContext(),
                );

                return (
                  <TableHead
                    key={header.id}
                    style={{ width: header.column.columnDef.meta?.width }}
                    className={cn("text-caption", header.column.columnDef.meta?.className)}
                    aria-sort={active ? (sort.desc ? "descending" : "ascending") : "none"}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(header.column)}
                        className="-mx-1.5 inline-flex items-center gap-1 rounded px-1.5 py-1 font-medium transition-colors hover:text-foreground focus-ring"
                      >
                        {label}
                        {active ? (
                          sort.desc ? (
                            <ArrowDown aria-hidden="true" className="size-3.5" />
                          ) : (
                            <ArrowUp aria-hidden="true" className="size-3.5" />
                          )
                        ) : (
                          <ChevronsUpDown aria-hidden="true" className="size-3.5 opacity-40" />
                        )}
                      </button>
                    ) : (
                      label
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.map((row) => {
            const href = getRowHref?.(row.original);
            const interactive = Boolean(href || onRowClick);
            return (
              <TableRow
                key={row.id}
                className={cn(interactive && "cursor-pointer")}
                onClick={
                  interactive
                    ? (event) => {
                        // Let real controls inside the row behave normally.
                        if (event.target.closest("a, button, input, [role='menuitem']")) return;
                        if (href) router.push(href);
                        else onRowClick(row.original);
                      }
                    : undefined
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn("py-3", cell.column.columnDef.meta?.className)}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
