import { pickList } from "@/app/lib/api/safe-list";
import { normalizeProject, normalizeTask, toUiStatus } from "@/app/lib/api/normalize";

/** @param {Record<string, unknown>} milestone @param {{ id: string, name?: string }} [phase] */
function normalizeMilestone(milestone, phase) {
  return {
    ...milestone,
    status: toUiStatus("milestoneStatus", milestone.status),
    phase: milestone.phase ?? (phase ? { id: phase.id, name: phase.name } : milestone.phaseId ? { id: milestone.phaseId } : null),
    tasks: milestone.tasks ?? [],
    approvals: milestone.approvals ?? [],
    dueDate: milestone.dueDate ?? null,
  };
}

/** @param {Record<string, unknown>} phase @param {Map<string, Record<string, unknown>>} [usersById] @param {Map<string, Record<string, unknown>>} [tasksById] */
function normalizePhase(phase, usersById, tasksById) {
  return {
    ...phase,
    status: toUiStatus("phaseStatus", phase.status),
    startDate: phase.startDate ?? null,
    dueDate: phase.dueDate ?? null,
    milestones: (phase.milestones ?? []).map((milestone) => normalizeMilestone(milestone, phase)),
    tasks: (phase.tasks ?? []).map((task) => normalizeTask(task, usersById, tasksById)),
  };
}

/** Collect tasks and subtasks into a map for dependency resolution. */
function indexTasks(tasks) {
  const map = new Map();
  const visit = (task) => {
    if (!task?.id) return;
    map.set(String(task.id), task);
    for (const sub of task.subtasks ?? []) visit(sub);
  };
  for (const task of tasks) visit(task);
  return map;
}

/**
 * Backend nests milestones under phases and omits flat `project.milestones`.
 * UI tabs expect phases, tasks, and a flat milestones list — normalize once here.
 *
 * @param {Record<string, unknown> | null | undefined} project
 * @param {Map<string, { id: string, name: string, avatarUrl?: string | null }>} [usersById]
 */
export function normalizeProjectPlan(project, usersById) {
  if (!project) {
    return { project: null, phases: [], tasks: [], milestones: [] };
  }

  const rawTasks = project.tasks ?? [];
  const tasksById = indexTasks(rawTasks.map((task) => normalizeTask(task, usersById)));

  for (const phase of project.phases ?? []) {
    for (const task of phase.tasks ?? []) {
      const normalized = normalizeTask(task, usersById, tasksById);
      tasksById.set(String(normalized.id), normalized);
    }
  }

  const phases = (project.phases ?? []).map((phase) => normalizePhase(phase, usersById, tasksById));

  const taskIds = new Set();
  const tasks = [];
  const addTask = (task) => {
    const normalized = normalizeTask(task, usersById, tasksById);
    if (taskIds.has(normalized.id)) return;
    taskIds.add(normalized.id);
    tasks.push(normalized);
  };

  for (const task of rawTasks) addTask(task);
  for (const phase of phases) {
    for (const task of phase.tasks) addTask(task);
  }

  const milestones = phases.flatMap((phase) => phase.milestones);
  const milestonesById = new Map(milestones.map((milestone) => [String(milestone.id), milestone]));
  const tasksWithMilestones = tasks.map((task) => ({
    ...task,
    milestone:
      task.milestone ??
      (task.milestoneId ? milestonesById.get(String(task.milestoneId)) ?? null : null),
  }));

  const base = normalizeProject(project, usersById);
  return {
    project: {
      ...base,
      actualCost: base.actualCost ?? 0,
      budget: base.budget ?? null,
      startDate: base.startDate ?? null,
      endDate: base.endDate ?? null,
      completionPercent: base.completionPercent ?? 0,
    },
    phases,
    tasks: tasksWithMilestones,
    milestones,
  };
}

/** @param {Record<string, unknown> | null | undefined} data @param {string} [usersKey] */
export function usersByIdFromData(data, usersKey = "users") {
  return new Map(pickList(data, usersKey).map((user) => [user.id, user]));
}
