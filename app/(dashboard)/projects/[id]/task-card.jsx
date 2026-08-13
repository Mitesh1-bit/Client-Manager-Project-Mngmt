"use client";

import { forwardRef } from "react";
import { CalendarDays, GitBranch, GripVertical, ListTree, Lock } from "lucide-react";

import { StatusBadge } from "@/app/components/domain/status-badge";
import { formatDate, initials } from "@/app/lib/format";
import { blockingTasks, isTaskBlocked, isTaskOverdue } from "@/app/lib/project";
import { terminalColumnStatus } from "@/app/lib/project-columns";
import { cn } from "@/app/lib/utils";

/**
 * The board card. Also used inside the drag overlay, so it takes a ref and
 * spreads drag listeners rather than owning any drag behaviour itself. Drag
 * listeners land on a dedicated grip handle, not the card itself — the card
 * also holds a real "open task" button, and a native button nested inside an
 * element with dnd-kit's `role="button"` drag attributes is an accessibility
 * violation (nested interactive controls). Same split as the sequence
 * builder's step card in Phase 6.
 */
export const TaskCard = forwardRef(function TaskCard(
  {
    task,
    onOpen,
    dragging,
    overlay,
    className,
    style,
    listeners,
    attributes,
    actions,
    movable = true,
    boardColumns = [],
  },
  ref,
) {
  const terminalStatus = terminalColumnStatus(boardColumns);
  const blocked = isTaskBlocked(task, terminalStatus);
  const blockers = blockingTasks(task, terminalStatus);
  const overdue = isTaskOverdue(task, terminalStatus);
  const doneSubtasks = task.subtasks.filter((subtask) => subtask.status === terminalStatus).length;

  return (
    <article
      ref={ref}
      style={style}
      className={cn(
        "group relative rounded-xl border bg-card p-3 text-left shadow-xs transition-shadow",
        "focus-within:ring-2 focus-within:ring-ring/50",
        overlay && "rotate-1 cursor-grabbing shadow-raised",
        // The original keeps its space in the column while it's being dragged.
        dragging && !overlay && "opacity-40",
        className,
      )}
    >
      <div className="flex items-start gap-2">
        {movable ? (
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="relative z-10 -ml-1 flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-ring active:cursor-grabbing"
            aria-label={`Reorder "${task.title}"`}
          >
            <GripVertical aria-hidden="true" className="size-4" />
          </button>
        ) : (
          <span
            aria-hidden="true"
            className="relative z-10 -ml-1 flex size-6 shrink-0 items-center justify-center text-muted-foreground/30"
          >
            <GripVertical className="size-4" />
          </span>
        )}

        <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
          <button
            type="button"
            onClick={() => onOpen?.(task)}
            className="min-w-0 flex-1 text-left text-caption font-medium text-pretty focus-ring rounded-sm"
          >
            {/* Stretched so the whole card opens the task, while the grip
                handle and menu above still get the pointer first (z-10). */}
            <span className="absolute inset-0" aria-hidden="true" />
            {task.title}
          </button>
          {actions}
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <StatusBadge kind="priority" value={task.priority} size="sm" />

        {blocked ? (
          <span
            className="inline-flex items-center gap-1 rounded-full border border-tone-critical-border bg-tone-critical-bg px-1.5 py-0.5 text-[0.6875rem] font-medium text-tone-critical-fg"
            title={`Waiting on ${blockers.map((item) => item.title).join(", ")}`}
          >
            <Lock aria-hidden="true" className="size-3" />
            Blocked
          </span>
        ) : null}

        {task.subtasks.length > 0 ? (
          <span className="inline-flex items-center gap-1 text-[0.6875rem] text-muted-foreground">
            <ListTree aria-hidden="true" className="size-3" />
            <span className="tabular">
              {doneSubtasks}/{task.subtasks.length}
            </span>
            <span className="sr-only">subtasks done</span>
          </span>
        ) : null}

        {task.dependencies.length > 0 ? (
          <span className="inline-flex items-center gap-1 text-[0.6875rem] text-muted-foreground">
            <GitBranch aria-hidden="true" className="size-3" />
            <span className="tabular">{task.dependencies.length}</span>
            <span className="sr-only">dependencies</span>
          </span>
        ) : null}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        {task.dueDate ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[0.6875rem]",
              overdue ? "font-medium text-tone-critical-fg" : "text-muted-foreground",
            )}
          >
            <CalendarDays aria-hidden="true" className="size-3" />
            <time dateTime={task.dueDate}>{formatDate(task.dueDate)}</time>
            {overdue ? <span className="sr-only">— overdue</span> : null}
          </span>
        ) : (
          <span />
        )}

        {task.assignee ? (
          <span
            title={task.assignee.name}
            className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[0.625rem] font-medium"
          >
            {initials(task.assignee.name)}
            <span className="sr-only">Assigned to {task.assignee.name}</span>
          </span>
        ) : (
          <span className="text-[0.6875rem] text-muted-foreground">Unassigned</span>
        )}
      </div>
    </article>
  );
});
