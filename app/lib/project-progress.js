import { toApiStatus } from "@/app/lib/api/normalize";
import { ProjectDetailHeaderDocument } from "@/app/lib/graphql/generated/documents";

/** Weighted Kanban progress — keep in sync with backend completion.py */
export const TASK_STATUS_PROGRESS = {
  TODO: 0,
  IN_PROGRESS: 40,
  REVIEW: 80,
  DONE: 100,
};

/** Map UI task status (DONE) to API value (done). */
export function taskStatusForApi(status) {
  return toApiStatus("taskStatus", status);
}

/** Refetch the project header after task/plan changes. */
export function projectHeaderRefetch(projectId) {
  return [{ query: ProjectDetailHeaderDocument, variables: { id: projectId } }];
}

/**
 * @param {string | null | undefined} status
 */
export function taskProgressPoints(status) {
  const key = String(status ?? "").toUpperCase();
  return TASK_STATUS_PROGRESS[key] ?? 0;
}

/**
 * Weighted average of task stage progress — matches backend completion_percent.
 *
 * @param {Array<{ status?: string }>} tasks
 */
export function computeTaskCompletionPercent(tasks) {
  if (!tasks?.length) return 0;
  const total = tasks.reduce((sum, task) => sum + taskProgressPoints(task.status), 0);
  return Math.round(total / tasks.length);
}

/**
 * @param {Array<{ status?: string, parentTask?: unknown }>} tasks
 */
export function taskCompletionSummary(tasks, { topLevelOnly = false } = {}) {
  const rows = topLevelOnly ? tasks.filter((task) => !task.parentTask) : tasks;
  const done = rows.filter((task) => String(task.status ?? "").toUpperCase() === "DONE").length;
  return {
    done,
    total: rows.length,
    percent: computeTaskCompletionPercent(rows),
  };
}
