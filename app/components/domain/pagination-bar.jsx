"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { buildQuery } from "@/app/lib/list-params";

/**
 * Pagination for server-driven lists. Navigates rather than holding state, so
 * the page number lives in the URL like every other list parameter.
 *
 * @param {{ pageInfo: { page: number, pageSize: number, totalPages: number, hasNextPage: boolean, hasPreviousPage: boolean }, totalCount: number, itemLabel?: string }} props
 */
export function PaginationBar({ pageInfo, totalCount, itemLabel = "results" }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalCount === 0) return null;

  const first = (pageInfo.page - 1) * pageInfo.pageSize + 1;
  const last = Math.min(pageInfo.page * pageInfo.pageSize, totalCount);

  function goTo(page) {
    router.push(buildQuery(searchParams, { page }), { scroll: false });
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 pt-4"
    >
      <p className="text-caption text-muted-foreground" aria-live="polite">
        Showing <span className="tabular font-medium text-foreground">{first}</span>–
        <span className="tabular font-medium text-foreground">{last}</span> of{" "}
        <span className="tabular font-medium text-foreground">{totalCount}</span> {itemLabel}
      </p>

      {pageInfo.totalPages > 1 ? (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!pageInfo.hasPreviousPage}
            onClick={() => goTo(pageInfo.page - 1)}
          >
            <ChevronLeft aria-hidden="true" />
            Previous
          </Button>
          <span className="tabular px-1 text-caption text-muted-foreground">
            Page {pageInfo.page} of {pageInfo.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!pageInfo.hasNextPage}
            onClick={() => goTo(pageInfo.page + 1)}
          >
            Next
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      ) : null}
    </nav>
  );
}
