"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Diamond } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { formatDate } from "@/app/lib/format";
import {
  MONTH_NAMES,
  calendarGrid,
  isTaskOverdue,
  parseDay,
  shiftMonth,
  startOfDay,
  toDayString,
} from "@/app/lib/project";
import { cn } from "@/app/lib/utils";

import { TaskSheet } from "../task-sheet";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_VISIBLE_PER_DAY = 3;

const TASK_TONE = {
  DONE: "bg-tone-positive-bg text-tone-positive-fg border-tone-positive-border",
  IN_PROGRESS: "bg-tone-info-bg text-tone-info-fg border-tone-info-border",
  REVIEW: "bg-tone-accent-bg text-tone-accent-fg border-tone-accent-border",
  TODO: "bg-muted text-muted-foreground border-border",
};

/**
 * Month view of what is due. Tasks land on their due date, milestones on
 * theirs — the calendar answers "what is landing this month", not "what is
 * being worked on", which is the timeline's job.
 */
export function ProjectCalendar({
  projectId,
  project,
  tasks = [],
  phases = [],
  milestones = [],
  users = [],
}) {
  const [panel, setPanel] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);

  // Open on the month the work is actually in, not necessarily today's.
  const [cursor, setCursor] = useState(() => {
    const anchor = parseDay(project.endDate) ?? new Date();
    const today = startOfDay(new Date());
    const start = parseDay(project.startDate);
    const useToday = start && anchor && today >= start && today <= anchor;
    const date = useToday ? today : (anchor ?? today);
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
  });

  const grid = useMemo(() => calendarGrid(cursor.year, cursor.month), [cursor]);

  const byDay = useMemo(() => {
    const map = new Map();
    const push = (key, item) => {
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    };

    for (const task of tasks) {
      if (!task.dueDate) continue;
      push(task.dueDate, { kind: "task", id: task.id, task });
    }
    for (const milestone of milestones) {
      if (!milestone.dueDate) continue;
      push(milestone.dueDate, {
        kind: "milestone",
        id: milestone.id,
        milestone,
      });
    }

    // Milestones first — they're the dates people plan around.
    for (const items of map.values()) {
      items.sort((a, b) =>
        a.kind === b.kind ? 0 : a.kind === "milestone" ? -1 : 1,
      );
    }
    return map;
  }, [tasks, milestones]);

  const todayKey = toDayString(new Date());
  const monthTotal = grid
    .filter((cell) => cell.inMonth)
    .reduce((total, cell) => total + (byDay.get(cell.key)?.length ?? 0), 0);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setCursor((c) => shiftMonth(c.year, c.month, -1))}
          >
            <ChevronLeft aria-hidden="true" />
            <span className="sr-only">Previous month</span>
          </Button>
          <h2
            className="min-w-44 text-center text-subheading"
            aria-live="polite"
          >
            {MONTH_NAMES[cursor.month]} {cursor.year}
          </h2>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setCursor((c) => shiftMonth(c.year, c.month, 1))}
          >
            <ChevronRight aria-hidden="true" />
            <span className="sr-only">Next month</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const today = new Date();
              setCursor({
                year: today.getUTCFullYear(),
                month: today.getUTCMonth(),
              });
            }}
          >
            Today
          </Button>
        </div>

        <p className="text-caption text-muted-foreground">
          {monthTotal === 0
            ? "Nothing due this month"
            : `${monthTotal} due this month`}
        </p>
      </div>

      {/* A seven-column month is unreadable below about 42rem, so the grid keeps
          its minimum and the card scrolls rather than crushing the cells.

          `relative` is load-bearing: `sr-only` is absolutely positioned, and
          without a positioned ancestor its containing block is the viewport,
          which lets it escape this scroll container and give the whole page a
          phantom horizontal scrollbar. */}
      <div className="relative overflow-x-auto rounded-xl border bg-card">
        <div className="min-w-[42rem]">
          <div className="grid grid-cols-7 border-b bg-muted/40">
            {WEEKDAYS.map((weekday) => (
              <div
                key={weekday}
                className="px-2 py-2 text-caption font-medium text-muted-foreground"
              >
                <span aria-hidden="true">{weekday}</span>
                <span className="sr-only">{weekday}day</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {grid.map((cell) => {
              const items = byDay.get(cell.key) ?? [];
              const isToday = cell.key === todayKey;
              const expanded = expandedDay === cell.key;
              const visible = expanded
                ? items
                : items.slice(0, MAX_VISIBLE_PER_DAY);

              return (
                <div
                  key={cell.key}
                  className={cn(
                    "min-h-28 border-r border-b p-1.5 last-of-type:border-r-0 nth-[7n]:border-r-0",
                    !cell.inMonth && "bg-muted/30",
                  )}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={cn(
                        "tabular flex size-6 items-center justify-center rounded-full text-[0.75rem]",
                        isToday &&
                          "bg-primary font-medium text-primary-foreground",
                        !isToday && !cell.inMonth && "text-muted-foreground/60",
                        !isToday && cell.inMonth && "text-muted-foreground",
                      )}
                    >
                      {cell.dayOfMonth}
                      {isToday ? (
                        <span className="sr-only"> (today)</span>
                      ) : null}
                    </span>
                  </div>

                  <ul className="space-y-1">
                    {visible.map((item) =>
                      item.kind === "milestone" ? (
                        <li key={item.id} className="min-w-0">
                          <span
                            className="flex min-w-0 items-center gap-1 rounded border border-tone-accent-border bg-tone-accent-bg px-1 py-0.5 text-[0.6875rem] text-tone-accent-fg"
                            title={item.milestone.title}
                          >
                            <Diamond
                              aria-hidden="true"
                              className="size-2.5 shrink-0 fill-current"
                            />
                            <span className="truncate">
                              {item.milestone.title}
                            </span>
                          </span>
                        </li>
                      ) : (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() =>
                              setPanel({ mode: "view", taskId: item.task.id })
                            }
                            title={item.task.title}
                            className={cn(
                              "block w-full truncate rounded border px-1 py-0.5 text-left text-[0.6875rem] transition-colors hover:brightness-95 focus-ring",
                              TASK_TONE[item.task.status],
                              isTaskOverdue(item.task) &&
                                "ring-1 ring-tone-critical/40",
                            )}
                          >
                            {item.task.title}
                            <span className="sr-only">
                              {" "}
                              due {formatDate(item.task.dueDate)}
                              {isTaskOverdue(item.task) ? ", overdue" : ""}
                            </span>
                          </button>
                        </li>
                      ),
                    )}
                  </ul>

                  {items.length > MAX_VISIBLE_PER_DAY ? (
                    <button
                      type="button"
                      onClick={() => setExpandedDay(expanded ? null : cell.key)}
                      className="mt-1 rounded px-1 text-[0.6875rem] text-muted-foreground hover:text-foreground focus-ring"
                    >
                      {expanded
                        ? "Show less"
                        : `+${items.length - MAX_VISIBLE_PER_DAY} more`}
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <TaskSheet
        projectId={projectId}
        panel={panel}
        onPanelChange={setPanel}
        tasks={tasks}
        phases={phases}
        milestones={milestones}
        users={users}
      />
    </>
  );
}
