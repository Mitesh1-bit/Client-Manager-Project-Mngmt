"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Diamond, GanttChartSquare, Lock } from "lucide-react";

import { EmptyState } from "@/app/components/domain/states";
import { Button } from "@/app/components/ui/button";
import { formatDate } from "@/app/lib/format";
import {
  barGeometry,
  isTaskBlocked,
  isTaskOverdue,
  markerPosition,
  timelineBounds,
  timelineMonths,
} from "@/app/lib/project";
import { cn } from "@/app/lib/utils";

import { TaskSheet } from "../task-sheet";

const ROW_HEIGHT = 34;
const PHASE_HEADER_HEIGHT = 32;

/**
 * Timeline view. Laid out as a CSS grid of percentage-positioned bars rather
 * than a canvas, so every bar stays a real, focusable button — keyboard users
 * tab through the plan in date order and screen readers read the dates.
 *
 * Dependency arrows are drawn in one absolutely-positioned SVG layer over the
 * rows, using the same percentage geometry as the bars.
 */
export function ProjectGantt({
  projectId,
  project,
  phases = [],
  tasks = [],
  milestones = [],
  users = [],
  canManage = false,
}) {
  const [panel, setPanel] = useState(null);
  const scrollRef = useRef(null);

  const dated = useMemo(
    () => [
      ...phases.map((phase) => ({
        startDate: phase.startDate,
        dueDate: phase.dueDate,
      })),
      ...tasks.map((task) => ({
        startDate: task.startDate,
        dueDate: task.dueDate,
      })),
      ...milestones.map((milestone) => ({
        startDate: milestone.dueDate,
        dueDate: milestone.dueDate,
      })),
    ],
    [phases, tasks, milestones],
  );

  const bounds = useMemo(
    () => timelineBounds(project, dated),
    [project, dated],
  );
  const months = useMemo(() => timelineMonths(bounds), [bounds]);
  const todayLeft = markerPosition(
    bounds,
    new Date().toISOString().slice(0, 10),
  );

  // Rows in render order, so the SVG arrow layer and the grid agree on y.
  const rows = useMemo(
    () => buildRows(phases, tasks, milestones),
    [phases, tasks, milestones],
  );
  const rowIndexByTask = useMemo(() => {
    const map = new Map();
    rows.forEach((row, index) => {
      if (row.kind === "task") map.set(row.task.id, index);
    });
    return map;
  }, [rows]);

  // SVG path data has no percentage units, so the arrow layer needs the bar
  // column's pixel width. Measured rather than assumed, because the pane
  // scrolls and the sidebar can collapse under it.
  const barsRef = useRef(null);
  const [barsWidth, setBarsWidth] = useState(0);

  useEffect(() => {
    const element = barsRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setBarsWidth(entry.contentRect.width),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const arrows = useMemo(
    () =>
      barsWidth > 0 ? buildArrows(rows, rowIndexByTask, bounds, barsWidth) : [],
    [rows, rowIndexByTask, bounds, barsWidth],
  );

  if (rows.length === 0) {
    return (
      <>
        <EmptyState
          icon={GanttChartSquare}
          title="Nothing to plot yet"
          description="Once tasks and milestones have dates, the timeline shows how they line up."
          action={
            canManage ? (
              <Button onClick={() => setPanel({ mode: "create" })}>
                Add a task
              </Button>
            ) : null
          }
        />
        <TaskSheet
          projectId={projectId}
          panel={panel}
          onPanelChange={setPanel}
          tasks={tasks}
          phases={phases}
          milestones={milestones}
          users={users}
          canManage={canManage}
        />
      </>
    );
  }

  const totalHeight = rows.reduce(
    (height, row) =>
      height + (row.kind === "phase" ? PHASE_HEADER_HEIGHT : ROW_HEIGHT),
    0,
  );

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Legend />
        <p className="text-caption text-muted-foreground">
          {formatDate(bounds.start)} – {formatDate(bounds.end)}
        </p>
      </div>

      <p className="mb-2 text-caption text-muted-foreground md:hidden">
        Swipe sideways to see the full timeline.
      </p>

      {/* The scroll container is the bordered card itself. `relative` keeps
          absolutely-positioned descendants — `sr-only` text especially — inside
          this scroller instead of letting them widen the whole page. */}
      <div
        ref={scrollRef}
        data-tour="project-timeline"
        className="scroll-panel relative rounded-xl border bg-card"
      >
        {/* A fixed min width keeps months legible; the pane scrolls instead of
            squeezing bars into invisibility on narrow screens. */}
        <div className="min-w-[52rem]">
          <div className="grid grid-cols-[14rem_1fr]">
            <div className="border-r border-b bg-muted/40 px-3 py-2 text-caption font-medium">
              Plan
            </div>
            <div className="relative border-b bg-muted/40">
              <div className="flex h-full">
                {months.map((month) => (
                  <div
                    key={month.key}
                    style={{ width: `${month.width}%` }}
                    className="border-l px-2 py-2 text-caption whitespace-nowrap text-muted-foreground first:border-l-0"
                  >
                    {month.label} {month.year}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative grid grid-cols-[14rem_1fr]">
            {/* Labels */}
            <div className="border-r">
              {rows.map((row) => (
                <div
                  key={row.key}
                  style={{
                    height:
                      row.kind === "phase" ? PHASE_HEADER_HEIGHT : ROW_HEIGHT,
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3",
                    row.kind === "phase" &&
                      "bg-muted/40 text-caption font-medium",
                    row.kind !== "phase" && "pl-6 text-caption",
                  )}
                >
                  <span className="truncate">
                    {row.kind === "phase"
                      ? row.phase.name
                      : row.kind === "milestone"
                        ? row.milestone.title
                        : row.task.title}
                  </span>
                </div>
              ))}
            </div>

            {/* Bars */}
            <div ref={barsRef} className="relative">
              {months.map((month) => (
                <div
                  key={month.key}
                  aria-hidden="true"
                  style={{ left: `${month.left}%` }}
                  className="absolute inset-y-0 w-px bg-border first:hidden"
                />
              ))}

              {todayLeft !== null ? (
                <div
                  aria-hidden="true"
                  style={{ left: `${todayLeft}%` }}
                  className="absolute inset-y-0 z-10 w-px bg-primary/70"
                >
                  <span className="absolute -top-0.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-primary" />
                </div>
              ) : null}

              <svg
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible"
                style={{ height: totalHeight }}
              >
                <defs>
                  <marker
                    id="gantt-arrow"
                    viewBox="0 0 8 8"
                    refX="6"
                    refY="4"
                    markerWidth="5"
                    markerHeight="5"
                    orient="auto"
                  >
                    <path
                      d="M0,1 L6,4 L0,7 z"
                      className="fill-muted-foreground/70"
                    />
                  </marker>
                </defs>
                {arrows.map((arrow) => (
                  <path
                    key={arrow.key}
                    d={arrow.d}
                    fill="none"
                    strokeWidth="1.25"
                    strokeDasharray={arrow.satisfied ? undefined : "3 2"}
                    className={cn(
                      arrow.satisfied
                        ? "stroke-muted-foreground/50"
                        : "stroke-tone-critical/70",
                    )}
                    markerEnd="url(#gantt-arrow)"
                  />
                ))}
              </svg>

              {rows.map((row) => (
                <div
                  key={row.key}
                  style={{
                    height:
                      row.kind === "phase" ? PHASE_HEADER_HEIGHT : ROW_HEIGHT,
                  }}
                  className={cn(
                    "relative",
                    row.kind === "phase" && "bg-muted/40",
                  )}
                >
                  {row.kind === "phase" ? (
                    <PhaseBar phase={row.phase} bounds={bounds} />
                  ) : row.kind === "milestone" ? (
                    <MilestoneMarker
                      milestone={row.milestone}
                      bounds={bounds}
                    />
                  ) : (
                    <TaskBar
                      task={row.task}
                      bounds={bounds}
                      onOpen={() =>
                        setPanel({ mode: "view", taskId: row.task.id })
                      }
                    />
                  )}
                </div>
              ))}
            </div>
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
        canManage={canManage}
      />
    </>
  );
}

function PhaseBar({ phase, bounds }) {
  const geometry = barGeometry(bounds, phase.startDate, phase.dueDate);
  if (!geometry) return null;

  return (
    <div
      style={{ left: `${geometry.left}%`, width: `${geometry.width}%` }}
      className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-foreground/15"
      title={`${phase.name}: ${formatDate(phase.startDate)} – ${formatDate(phase.dueDate)}`}
    />
  );
}

const TASK_BAR_TONE = {
  DONE: "bg-tone-positive-bg border-tone-positive-border text-tone-positive-fg",
  IN_PROGRESS: "bg-tone-info-bg border-tone-info-border text-tone-info-fg",
  REVIEW: "bg-tone-accent-bg border-tone-accent-border text-tone-accent-fg",
  TODO: "bg-muted border-border text-muted-foreground",
};

function TaskBar({ task, bounds, onOpen }) {
  const geometry = barGeometry(bounds, task.startDate, task.dueDate);
  const overdue = isTaskOverdue(task);
  const blocked = isTaskBlocked(task);

  if (!geometry) {
    return (
      <span className="absolute top-1/2 left-2 -translate-y-1/2 text-[0.6875rem] text-muted-foreground">
        No dates
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      style={{ left: `${geometry.left}%`, width: `${geometry.width}%` }}
      className={cn(
        "absolute top-1/2 flex h-5 -translate-y-1/2 items-center gap-1 rounded border px-1.5 text-[0.6875rem] transition-shadow hover:shadow-card focus-ring",
        TASK_BAR_TONE[task.status],
        overdue && "border-tone-critical-border ring-1 ring-tone-critical/40",
      )}
    >
      {blocked ? (
        <Lock aria-hidden="true" className="size-2.5 shrink-0" />
      ) : null}
      <span className="truncate">
        {task.title}
        <span className="sr-only">
          {" "}
          — {formatDate(task.startDate)} to {formatDate(task.dueDate)}
          {overdue ? ", overdue" : ""}
          {blocked ? ", blocked" : ""}
        </span>
      </span>
    </button>
  );
}

function MilestoneMarker({ milestone, bounds }) {
  const left = markerPosition(bounds, milestone.dueDate);
  if (left === null) return null;

  return (
    <span
      style={{ left: `${left}%` }}
      className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5"
      title={`${milestone.title} — ${formatDate(milestone.dueDate)}`}
    >
      <Diamond
        aria-hidden="true"
        className={cn(
          "size-3 shrink-0 rotate-0",
          milestone.status === "COMPLETED"
            ? "fill-tone-positive text-tone-positive"
            : milestone.status === "AT_RISK"
              ? "fill-tone-critical text-tone-critical"
              : "fill-tone-accent text-tone-accent",
        )}
      />
      <span className="whitespace-nowrap text-[0.6875rem] text-muted-foreground">
        {formatDate(milestone.dueDate)}
      </span>
    </span>
  );
}

function Legend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.75rem] text-muted-foreground">
      <li className="flex items-center gap-1.5">
        <span
          className="h-2 w-6 rounded-full bg-foreground/15"
          aria-hidden="true"
        />
        Phase
      </li>
      <li className="flex items-center gap-1.5">
        <span
          className="h-3 w-6 rounded border border-tone-info-border bg-tone-info-bg"
          aria-hidden="true"
        />
        Task
      </li>
      <li className="flex items-center gap-1.5">
        <Diamond
          aria-hidden="true"
          className="size-3 fill-tone-accent text-tone-accent"
        />
        Milestone
      </li>
      <li className="flex items-center gap-1.5">
        <span className="h-3 w-px bg-primary/70" aria-hidden="true" />
        Today
      </li>
      <li className="flex items-center gap-1.5">
        <svg width="24" height="8" aria-hidden="true">
          <line
            x1="0"
            y1="4"
            x2="24"
            y2="4"
            strokeDasharray="3 2"
            className="stroke-tone-critical/70"
            strokeWidth="1.25"
          />
        </svg>
        Unmet dependency
      </li>
    </ul>
  );
}

/** Phase header, then its milestones, then its tasks; unphased work last. */
function buildRows(phases, tasks, milestones) {
  const rows = [];
  const topLevel = tasks.filter((task) => !task.parentTask);

  for (const phase of phases) {
    const phaseTasks = topLevel.filter((task) => task.phase?.id === phase.id);
    const phaseMilestones = milestones.filter(
      (milestone) => milestone.phase?.id === phase.id,
    );
    if (phaseTasks.length === 0 && phaseMilestones.length === 0) continue;

    rows.push({ kind: "phase", key: `phase-${phase.id}`, phase });
    for (const milestone of phaseMilestones) {
      rows.push({
        kind: "milestone",
        key: `milestone-${milestone.id}`,
        milestone,
      });
    }
    for (const task of phaseTasks) {
      rows.push({ kind: "task", key: `task-${task.id}`, task });
    }
  }

  const unphased = topLevel.filter((task) => !task.phase);
  if (unphased.length > 0) {
    rows.push({
      kind: "phase",
      key: "phase-none",
      phase: { id: "none", name: "No phase", startDate: null, dueDate: null },
    });
    for (const task of unphased)
      rows.push({ kind: "task", key: `task-${task.id}`, task });
  }

  return rows;
}

/**
 * One elbow path per dependency: out of the right edge of the predecessor,
 * around, and into the left edge of the dependent task.
 *
 * `width` is the bar column's pixel width — the bars are positioned in
 * percentages, but SVG path data only takes numbers, so the geometry is
 * converted here.
 */
function buildArrows(rows, rowIndexByTask, bounds, width) {
  const px = (percent) => (percent / 100) * width;
  const yOf = (index) => {
    let y = 0;
    for (let i = 0; i < index; i += 1) {
      y += rows[i].kind === "phase" ? PHASE_HEADER_HEIGHT : ROW_HEIGHT;
    }
    return y + ROW_HEIGHT / 2;
  };

  const arrows = [];

  for (const row of rows) {
    if (row.kind !== "task") continue;
    const toIndex = rowIndexByTask.get(row.task.id);
    const toGeometry = barGeometry(
      bounds,
      row.task.startDate,
      row.task.dueDate,
    );
    if (toGeometry === null || toIndex === undefined) continue;

    for (const dep of row.task.dependencies ?? []) {
      const fromIndex = rowIndexByTask.get(dep.dependsOnTask.id);
      if (fromIndex === undefined) continue;

      const fromTask = rows[fromIndex].task;
      const fromGeometry = barGeometry(
        bounds,
        fromTask.startDate,
        fromTask.dueDate,
      );
      if (!fromGeometry) continue;

      const x1 = px(fromGeometry.left + fromGeometry.width);
      const y1 = yOf(fromIndex);
      const x2 = px(toGeometry.left);
      const y2 = yOf(toIndex);

      // When the successor starts before its predecessor ends, the elbow has
      // to route around rather than double back through the bars.
      const midX = x2 > x1 + 12 ? (x1 + x2) / 2 : x1 + 10;
      arrows.push({
        key: dep.id,
        satisfied: dep.dependsOnTask.status === "DONE",
        d: [
          `M ${round(x1)} ${y1}`,
          `L ${round(midX)} ${y1}`,
          `L ${round(midX)} ${y2}`,
          `L ${round(x2)} ${y2}`,
        ].join(" "),
      });
    }
  }

  return arrows;
}

const round = (value) => Math.round(value * 100) / 100;
