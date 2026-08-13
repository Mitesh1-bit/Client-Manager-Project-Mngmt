import { toApiStatus } from "@/app/lib/api/normalize";
import { ProjectDetailHeaderDocument } from "@/app/lib/graphql/generated/documents";
import { terminalColumnStatus } from "@/app/lib/project-columns";

/** Map UI task status (DONE) to API value (done). */
export function taskStatusForApi(status) {
  return toApiStatus("taskStatus", status);
}

/** Refetch the project header after task/plan changes. */
export function projectHeaderRefetch(projectId) {
  return [{ query: ProjectDetailHeaderDocument, variables: { id: projectId } }];
}

/**
 * Weighted Kanban progress — matches backend completion.py: the terminal
 * column is always 100% regardless of its position, every other column's
 * weight is just its position as a fraction of the total column count.
 *
 * @param {string | null | undefined} status
 * @param {Array<{ status: string, isTerminal: boolean }>} boardColumns
 */
export function taskProgressPoints(status, boardColumns) {
  const n = boardColumns?.length ?? 0;
  const index = boardColumns?.findIndex((column) => column.status === status) ?? -1;
  if (index === -1) return 0;
  if (boardColumns[index].isTerminal) return 100;
  return n > 1 ? (index / (n - 1)) * 100 : 0;
}

/**
 * Weighted average of task stage progress — matches backend completion_percent.
 *
 * @param {Array<{ status?: string }>} tasks
 * @param {Array<{ status: string, isTerminal: boolean }>} boardColumns
 */
export function computeTaskCompletionPercent(tasks, boardColumns) {
  if (!tasks?.length || !boardColumns?.length) return 0;
  const total = tasks.reduce((sum, task) => sum + taskProgressPoints(task.status, boardColumns), 0);
  return Math.round(total / tasks.length);
}

/**
 * @param {Array<{ status?: string, parentTask?: unknown }>} tasks
 * @param {Array<{ status: string, isTerminal: boolean }>} boardColumns
 */
export function taskCompletionSummary(tasks, boardColumns, { topLevelOnly = false } = {}) {
  const terminalStatus = terminalColumnStatus(boardColumns);
  const rows = topLevelOnly ? tasks.filter((task) => !task.parentTask) : tasks;
  const done = rows.filter((task) => task.status === terminalStatus).length;
  return {
    done,
    total: rows.length,
    percent: computeTaskCompletionPercent(rows, boardColumns),
  };
}
