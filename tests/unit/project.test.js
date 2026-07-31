import { describe, expect, it } from "vitest";

import {
  barGeometry,
  blockingTasks,
  calendarGrid,
  daysBetween,
  groupTasksByStatus,
  isTaskBlocked,
  isTaskOverdue,
  markerPosition,
  moveTask,
  shiftMonth,
  taskCompletion,
  timelineBounds,
  timelineMonths,
  toDayString,
} from "@/app/lib/project";

const task = (id, status, orderIndex, extra = {}) => ({
  id,
  status,
  orderIndex,
  parentTask: null,
  dependencies: [],
  ...extra,
});

describe("groupTasksByStatus", () => {
  it("buckets top-level tasks into columns in order", () => {
    const columns = groupTasksByStatus([
      task("b", "TODO", 1),
      task("a", "TODO", 0),
      task("c", "DONE", 0),
    ]);
    expect(columns.TODO.map((t) => t.id)).toEqual(["a", "b"]);
    expect(columns.DONE.map((t) => t.id)).toEqual(["c"]);
    expect(columns.REVIEW).toEqual([]);
  });

  it("leaves subtasks off the board — they belong to their parent card", () => {
    const columns = groupTasksByStatus([
      task("parent", "TODO", 0),
      task("child", "TODO", 0, { parentTask: { id: "parent" } }),
    ]);
    expect(columns.TODO.map((t) => t.id)).toEqual(["parent"]);
  });

  it("ignores a status that isn't a board column", () => {
    const columns = groupTasksByStatus([task("x", "ARCHIVED", 0)]);
    expect(Object.values(columns).flat()).toEqual([]);
  });
});

describe("moveTask", () => {
  const columns = groupTasksByStatus([
    task("a", "TODO", 0),
    task("b", "TODO", 1),
    task("c", "TODO", 2),
    task("x", "DONE", 0),
  ]);

  it("reorders within a column and renumbers", () => {
    const next = moveTask(columns, "c", "TODO", 0);
    expect(next.TODO.map((t) => t.id)).toEqual(["c", "a", "b"]);
    expect(next.TODO.map((t) => t.orderIndex)).toEqual([0, 1, 2]);
  });

  it("moves between columns, renumbering both sides", () => {
    const next = moveTask(columns, "a", "DONE", 0);
    expect(next.TODO.map((t) => t.id)).toEqual(["b", "c"]);
    expect(next.TODO.map((t) => t.orderIndex)).toEqual([0, 1]);
    expect(next.DONE.map((t) => t.id)).toEqual(["a", "x"]);
    expect(next.DONE.map((t) => t.orderIndex)).toEqual([0, 1]);
  });

  it("sets the moved task's status to the destination column", () => {
    const next = moveTask(columns, "a", "REVIEW", 0);
    expect(next.REVIEW[0].status).toBe("REVIEW");
  });

  it("clamps an index past the end of the destination", () => {
    const next = moveTask(columns, "a", "DONE", 99);
    expect(next.DONE.map((t) => t.id)).toEqual(["x", "a"]);
  });

  it("does not mutate the columns it was given", () => {
    const before = columns.TODO.map((t) => t.id);
    moveTask(columns, "c", "TODO", 0);
    expect(columns.TODO.map((t) => t.id)).toEqual(before);
  });

  it("returns the input unchanged for an unknown task", () => {
    expect(moveTask(columns, "nope", "TODO", 0)).toBe(columns);
  });
});

describe("blocked tasks", () => {
  it("is blocked while any predecessor is unfinished", () => {
    const blocked = task("a", "TODO", 0, {
      dependencies: [
        { id: "d1", dependsOnTask: { id: "b", title: "B", status: "DONE" } },
        { id: "d2", dependsOnTask: { id: "c", title: "C", status: "IN_PROGRESS" } },
      ],
    });
    expect(isTaskBlocked(blocked)).toBe(true);
    expect(blockingTasks(blocked).map((t) => t.id)).toEqual(["c"]);
  });

  it("is not blocked once every predecessor is done", () => {
    const free = task("a", "TODO", 0, {
      dependencies: [{ id: "d1", dependsOnTask: { id: "b", title: "B", status: "DONE" } }],
    });
    expect(isTaskBlocked(free)).toBe(false);
    expect(blockingTasks(free)).toEqual([]);
  });
});

describe("isTaskOverdue", () => {
  const now = new Date("2026-07-29T12:00:00Z");

  it("is overdue when past due and unfinished", () => {
    expect(isTaskOverdue({ dueDate: "2026-07-28", status: "IN_PROGRESS" }, now)).toBe(true);
  });

  it("is not overdue on the due date itself", () => {
    expect(isTaskOverdue({ dueDate: "2026-07-29", status: "TODO" }, now)).toBe(false);
  });

  it("is never overdue once done", () => {
    expect(isTaskOverdue({ dueDate: "2026-01-01", status: "DONE" }, now)).toBe(false);
  });

  it("does not invent a deadline for a task with no due date", () => {
    expect(isTaskOverdue({ dueDate: null, status: "TODO" }, now)).toBe(false);
  });
});

describe("taskCompletion", () => {
  it("counts top-level tasks only", () => {
    const result = taskCompletion([
      task("a", "DONE", 0),
      task("b", "TODO", 1),
      task("c", "DONE", 0, { parentTask: { id: "a" } }),
    ]);
    expect(result).toEqual({ done: 1, total: 2, percent: 50 });
  });

  it("reports 0% rather than dividing by zero", () => {
    expect(taskCompletion([])).toEqual({ done: 0, total: 0, percent: 0 });
  });
});

describe("timelineBounds", () => {
  it("spans everything dated, with padding", () => {
    const bounds = timelineBounds(
      { startDate: "2026-03-01", endDate: "2026-03-31" },
      [{ startDate: "2026-02-20", dueDate: "2026-04-10" }],
      { padDays: 5, minDays: 1 },
    );
    expect(toDayString(bounds.start)).toBe("2026-02-15");
    expect(toDayString(bounds.end)).toBe("2026-04-15");
  });

  it("widens a too-short window to stay readable", () => {
    const bounds = timelineBounds(
      { startDate: "2026-03-01", endDate: "2026-03-02" },
      [],
      { padDays: 0, minDays: 21 },
    );
    expect(daysBetween(bounds.start, bounds.end)).toBe(21);
  });

  it("falls back to a window around today when nothing has dates", () => {
    const bounds = timelineBounds({}, []);
    expect(daysBetween(bounds.start, bounds.end)).toBe(21);
  });
});

describe("barGeometry", () => {
  const bounds = { start: new Date("2026-03-01T00:00:00Z"), end: new Date("2026-03-11T00:00:00Z") };

  it("places a bar proportionally across the window", () => {
    const bar = barGeometry(bounds, "2026-03-01", "2026-03-05");
    expect(bar.left).toBeCloseTo(0, 5);
    // Five inclusive days out of a ten-day window.
    expect(bar.width).toBeCloseTo(50, 5);
  });

  it("gives a same-day task a full day of width, not zero", () => {
    const bar = barGeometry(bounds, "2026-03-06", "2026-03-06");
    expect(bar.width).toBeCloseTo(10, 5);
  });

  it("treats a one-sided range as a single day", () => {
    expect(barGeometry(bounds, null, "2026-03-06").left).toBeCloseTo(50, 5);
    expect(barGeometry(bounds, "2026-03-06", null).left).toBeCloseTo(50, 5);
  });

  it("returns null when there is no date at all", () => {
    expect(barGeometry(bounds, null, null)).toBeNull();
  });

  it("never lets a bar overflow the right edge", () => {
    const bar = barGeometry(bounds, "2026-03-09", "2026-04-30");
    expect(bar.left + bar.width).toBeLessThanOrEqual(100.0001);
  });
});

describe("markerPosition", () => {
  const bounds = { start: new Date("2026-03-01T00:00:00Z"), end: new Date("2026-03-11T00:00:00Z") };

  it("places a date proportionally", () => {
    expect(markerPosition(bounds, "2026-03-06")).toBeCloseTo(50, 5);
  });

  it("returns null outside the window, so nothing is drawn off-chart", () => {
    expect(markerPosition(bounds, "2026-02-01")).toBeNull();
    expect(markerPosition(bounds, "2026-05-01")).toBeNull();
  });
});

describe("timelineMonths", () => {
  it("splits the window into month segments that tile to 100%", () => {
    const months = timelineMonths({
      start: new Date("2026-01-15T00:00:00Z"),
      end: new Date("2026-04-10T00:00:00Z"),
    });
    expect(months.map((m) => m.label)).toEqual(["Jan", "Feb", "Mar", "Apr"]);
    const total = months.reduce((sum, m) => sum + m.width, 0);
    expect(total).toBeCloseTo(100, 5);
    expect(months[0].left).toBeCloseTo(0, 5);
  });
});

describe("calendarGrid", () => {
  it("returns six Monday-first weeks", () => {
    const grid = calendarGrid(2026, 6); // July 2026
    expect(grid).toHaveLength(42);
    // 1 July 2026 is a Wednesday, so the grid starts on Monday 29 June.
    expect(grid[0].key).toBe("2026-06-29");
    expect(grid[0].inMonth).toBe(false);
    expect(grid[2].key).toBe("2026-07-01");
    expect(grid[2].inMonth).toBe(true);
  });

  it("marks only the target month as in-month", () => {
    const grid = calendarGrid(2026, 6);
    expect(grid.filter((cell) => cell.inMonth)).toHaveLength(31);
  });
});

describe("shiftMonth", () => {
  it("wraps the year in both directions", () => {
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
  });
});
