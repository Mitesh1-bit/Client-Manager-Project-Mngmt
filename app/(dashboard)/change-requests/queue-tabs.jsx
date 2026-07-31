"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { buildQuery } from "@/app/lib/list-params";
import { cn } from "@/app/lib/utils";

/**
 * The three buckets the brief names, plus "all". Implemented as links that set
 * a `bucket` search param, so each one is shareable and the server does the
 * filtering — same contract as every other list in the app.
 */
const BUCKETS = [
  { key: "all", label: "All" },
  { key: "submitted", label: "Submitted" },
  { key: "pending-approval", label: "Pending approval" },
  { key: "overdue", label: "Overdue" },
];

export function QueueTabs({ counts, active }) {
  const searchParams = useSearchParams();

  return (
    <div className="-mx-(--content-gutter) overflow-x-auto px-(--content-gutter)">
      <nav aria-label="Queue">
        <ul className="flex min-w-max items-center gap-1 border-b">
          {BUCKETS.map((bucket) => {
            const isActive = active === bucket.key;
            const count = counts[bucket.key];

            return (
              <li key={bucket.key}>
                <Link
                  href={buildQuery(searchParams, {
                    bucket: bucket.key === "all" ? null : bucket.key,
                    page: null,
                  })}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-caption font-medium whitespace-nowrap transition-colors focus-ring",
                    isActive
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                  )}
                >
                  {bucket.label}
                  {typeof count === "number" ? (
                    <span
                      className={cn(
                        "tabular rounded-full px-1.5 py-0.5 text-[0.6875rem]",
                        bucket.key === "overdue" && count > 0
                          ? "bg-tone-critical text-white"
                          : isActive
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {count}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
