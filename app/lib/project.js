/**
 * Board and timeline maths for the planning views.
 *
 * Everything here is a pure function over plain task/phase objects. The Kanban
 * board's optimistic reorder, the Gantt's geometry and the calendar's grid all
 * run through these so the behaviour can be tested without a browser.
 */

import { computeTaskCompletionPercent } from "@/app/lib/project-progress";
import { terminalColumnStatus } from "@/app/lib/project-columns";

const byOrder = (a, b) => a.orderIndex - b.orderIndex;

/**
 * Groups top-level tasks into board columns. Subtasks are deliberately left
 * out — they belong to their parent card, not to a column of their own. Any
 * task whose status matches none of the project's columns (stale data, a
 * column that got deleted from under it) lands in `_unknown` instead of
 * silently vanishing from the board.
 *
 * @param {Array<{ id: string, status: string, orderIndex: number, parentTask?: { id: string } | null }>} tasks
 * @param {Array<{ status: string }>} boardColumns
 * @returns {Record<string, unknown[]>}
 */
export function groupTasksByStatus(tasks, boardColumns) {
  const statuses = boardColumns.map((column) => column.status);
  const columns = Object.fromEntries(statuses.map((status) => [status, []]));
  columns._unknown = [];
  for (const task of tasks) {
    if (task.parentTask) continue;
    (columns[task.status] ?? columns._unknown).push(task);
  }
  for (const key of Object.keys(columns)) columns[key].sort(byOrder);
  return columns;
}

/**
 * Moves a task inside the grouped-column structure and renumbers `orderIndex`
 * in every column it touched. Returns new objects throughout — the caller
 * holds this as optimistic state while the mutation is in flight.
 *
 * @param {Record<string, unknown[]>} columns
 * @param {string} taskId
 * @param {string} toStatus
 * @param {number} toIndex position within the destination column
 * @param {Array<{ status: string }>} boardColumns
 */
export function moveTask(columns, taskId, toStatus, toIndex, boardColumns) {
  const statuses = [...boardColumns.map((column) => column.status), "_unknown"];
  const fromStatus = statuses.find((status) =>
    (columns[status] ?? []).some((task) => task.id === taskId),
  );
  if (!fromStatus || !columns[toStatus]) return columns;

  const task = columns[fromStatus].find((row) => row.id === taskId);
  const next = Object.fromEntries(
    statuses.map((status) => [status, (columns[status] ?? []).filter((row) => row.id !== taskId)]),
  );

  const at = Math.max(0, Math.min(toIndex, next[toStatus].length));
  next[toStatus].splice(at, 0, { ...task, status: toStatus });

  for (const status of [fromStatus, toStatus]) {
    next[status] = next[status].map((row, index) =>
      row.orderIndex === index ? row : { ...row, orderIndex: index },
    );
  }
  return next;
}

/**
 * A task is blocked while any task it depends on is unfinished. Drives the
 * board's blocked badge and the warning on the task sheet.
 */
export function isTaskBlocked(task, terminalStatus) {
  return (task.dependencies ?? []).some((dep) => dep.dependsOnTask.status !== terminalStatus);
}

/** The unfinished predecessors, for naming them in the UI. */
export function blockingTasks(task, terminalStatus) {
  return (task.dependencies ?? [])
    .filter((dep) => dep.dependsOnTask.status !== terminalStatus)
    .map((dep) => dep.dependsOnTask);
}

/**
 * Overdue means past its due date and not finished. Tasks with no due date are
 * never overdue — we don't invent a deadline nobody set.
 */
export function isTaskOverdue(task, terminalStatus, today = new Date()) {
  if (!task.dueDate || task.status === terminalStatus) return false;
  return parseDay(task.dueDate) < startOfDay(today);
}

/** Weighted stage progress for top-level board tasks. */
export function taskCompletion(tasks, boardColumns) {
  const terminalStatus = terminalColumnStatus(boardColumns);
  const topLevel = tasks.filter((task) => !task.parentTask);
  const done = topLevel.filter((task) => task.status === terminalStatus).length;
  return {
    done,
    total: topLevel.length,
    percent: computeTaskCompletionPercent(topLevel, boardColumns),
  };
}

// --- date helpers -----------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;

/** Parses `YYYY-MM-DD` as UTC midnight so no time zone can shift the day. */
export function parseDay(value) {
  if (!value) return null;
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00Z`)
    : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function startOfDay(value) {
  const date = value instanceof Date ? new Date(value) : parseDay(value);
  if (!date) return null;
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

export function addDays(value, days) {
  const date = startOfDay(value);
  return new Date(date.getTime() + days * DAY_MS);
}

export function daysBetween(from, to) {
  return Math.round((startOfDay(to) - startOfDay(from)) / DAY_MS);
}

export function toDayString(value) {
  return startOfDay(value).toISOString().slice(0, 10);
}

// --- Gantt geometry ---------------------------------------------------------

/**
 * The window the timeline should cover: everything dated on the project, padded
 * so bars never touch the edge, and always wide enough to be readable.
 *
 * @param {{ startDate?: string|null, endDate?: string|null }} project
 * @param {Array<{ startDate?: string|null, dueDate?: string|null }>} dated
 */
export function timelineBounds(project, dated, { padDays = 5, minDays = 21 } = {}) {
  const values = [project?.startDate, project?.endDate];
  for (const item of dated) values.push(item.startDate, item.dueDate);

  const days = values.map(parseDay).filter(Boolean);
  if (days.length === 0) {
    const today = startOfDay(new Date());
    return { start: addDays(today, -7), end: addDays(today, 14) };
  }

  let start = addDays(new Date(Math.min(...days)), -padDays);
  let end = addDays(new Date(Math.max(...days)), padDays);

  const span = daysBetween(start, end);
  if (span < minDays) end = addDays(start, minDays);

  return { start, end };
}

/**
 * Where a dated range sits in the timeline, as percentages. A bar always gets a
 * visible width, so a same-day task doesn't render as a zero-width sliver.
 */
export function barGeometry({ start, end }, from, to, { minPercent = 0.8 } = {}) {
  const total = daysBetween(start, end) || 1;
  const barStart = parseDay(from) ?? parseDay(to);
  const barEnd = parseDay(to) ?? parseDay(from);
  if (!barStart || !barEnd) return null;

  const offset = (daysBetween(start, barStart) / total) * 100;
  // +1 so a task that starts and ends on the same day covers that whole day.
  const width = ((daysBetween(barStart, barEnd) + 1) / total) * 100;

  return {
    left: Math.max(0, Math.min(100, offset)),
    width: Math.max(minPercent, Math.min(100 - Math.max(0, offset), width)),
  };
}

/** Position of a single date in the timeline, as a percentage. Null if outside. */
export function markerPosition({ start, end }, value) {
  const date = parseDay(value);
  if (!date) return null;
  const total = daysBetween(start, end) || 1;
  const offset = (daysBetween(start, date) / total) * 100;
  return offset < 0 || offset > 100 ? null : offset;
}

/**
 * Month boundaries across the timeline, for the Gantt's header ruler.
 * @returns {Array<{ key: string, label: string, left: number, width: number }>}
 */
export function timelineMonths({ start, end }) {
  const total = daysBetween(start, end) || 1;
  const months = [];

  let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  while (cursor <= end) {
    const monthStart = cursor < start ? start : cursor;
    const nextMonth = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
    const monthEnd = nextMonth > end ? end : nextMonth;

    const left = (daysBetween(start, monthStart) / total) * 100;
    const width = (daysBetween(monthStart, monthEnd) / total) * 100;
    if (width > 0) {
      months.push({
        key: `${cursor.getUTCFullYear()}-${cursor.getUTCMonth()}`,
        label: MONTH_LABELS[cursor.getUTCMonth()],
        year: cursor.getUTCFullYear(),
        left,
        width,
      });
    }
    cursor = nextMonth;
  }
  return months;
}

/**
 * Derived from the same formatter `app/lib/format.js` uses, so the ruler says
 * "Sept" where the rest of the app says "5 Sept 2026" rather than "Sep".
 */
const shortMonth = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" });
const MONTH_LABELS = Array.from({ length: 12 }, (_, month) =>
  shortMonth.format(new Date(Date.UTC(2026, month, 1))),
);

// --- calendar ---------------------------------------------------------------

/**
 * A six-week Monday-first grid covering the given month, including the
 * leading/trailing days that fill the first and last rows.
 *
 * @param {number} year
 * @param {number} month 0-indexed
 */
export function calendarGrid(year, month) {
  const first = new Date(Date.UTC(year, month, 1));
  // getUTCDay is Sunday-based; shift so Monday is 0.
  const leading = (first.getUTCDay() + 6) % 7;
  const gridStart = addDays(first, -leading);

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);
    return {
      date,
      key: toDayString(date),
      dayOfMonth: date.getUTCDate(),
      inMonth: date.getUTCMonth() === month,
    };
  });
}

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Shifts a year/month pair by whole months, wrapping the year. */
export function shiftMonth(year, month, delta) {
  const date = new Date(Date.UTC(year, month + delta, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
}
