import { CircleAlert } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { Skeleton } from "@/app/components/ui/skeleton";
import { cn } from "@/app/lib/utils";

/**
 * Shared empty state. Every list and table view must render one of these rather
 * than a blank panel.
 */
export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/40 px-6 py-14 text-center",
        className,
      )}
    >
      {Icon ? (
        <span className="mb-4 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon aria-hidden="true" className="size-5" />
        </span>
      ) : null}
      <p className="text-subheading text-foreground">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-md text-caption text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/**
 * Shared error state. `onRetry` is required in practice — a dead end with no
 * way forward is the thing this exists to prevent.
 */
export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this right now. This is usually temporary.",
  onRetry,
  retryLabel = "Try again",
  className,
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-tone-critical-border bg-tone-critical-bg/50 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="mb-4 flex size-11 items-center justify-center rounded-full bg-tone-critical-bg text-tone-critical-fg">
        <CircleAlert aria-hidden="true" className="size-5" />
      </span>
      <p className="text-subheading text-foreground">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-md whitespace-pre-wrap text-caption text-muted-foreground">
          {description}
        </p>
      ) : null}
      {onRetry ? (
        <Button className="mt-5" variant="outline" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

/** Row skeleton used while list data loads — never a spinner. */
export function ListSkeleton({ rows = 5, className }) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-4 rounded-lg border bg-card p-4">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/5" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * Table skeleton. Column widths mirror the real table so the swap to loaded
 * data doesn't shift the layout.
 */
export function TableSkeleton({ rows = 8, columns = 6, className }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border bg-card", className)} aria-hidden="true">
      <div className="flex items-center gap-4 border-b px-4 py-3">
        {Array.from({ length: columns }, (_, index) => (
          <Skeleton key={index} className={cn("h-3", index === 0 ? "w-40" : "w-20")} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 border-b px-4 py-3.5 last:border-b-0">
          <div className="flex w-40 items-center gap-2.5">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-3.5 flex-1" />
          </div>
          {Array.from({ length: columns - 1 }, (_, cellIndex) => (
            <Skeleton key={cellIndex} className="h-3.5 w-20" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function TimelineSkeleton({ rows = 5, className }) {
  return (
    <div className={cn("space-y-5", className)} aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex gap-3.5">
          <Skeleton className="size-[2.125rem] shrink-0 rounded-full" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-3.5 w-3/5" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ cards = 4, className }) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2", className)} aria-hidden="true">
      {Array.from({ length: cards }, (_, index) => (
        <div key={index} className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-2/5" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  );
}

/**
 * Section wrapper used across every detail tab so headings, spacing and the
 * optional action slot stay identical between modules.
 */
export function SectionCard({ title, description, actions, children, className }) {
  return (
    <section className={cn("rounded-xl border bg-card", className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-subheading">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-caption text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
