import { z } from "zod";

import { toApiStatus, toUiStatus } from "@/app/lib/api/normalize";
import { toApiDate, toDateInputValue } from "@/app/lib/date-input";

/** Client-side validation for the task form. Mirrors `TaskInput`. */

const optionalText = (max, message) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => value || null);

const optionalId = z.string().optional().transform((value) => value || null);
const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || null);

export const taskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "Give the task a title of at least 2 characters.")
      .max(160, "Keep the title under 160 characters."),
    description: optionalText(2000, "Keep this under 2000 characters."),
    status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    assigneeId: optionalId,
    phaseId: optionalId,
    milestoneId: optionalId,
    parentTaskId: optionalId,
    startDate: optionalDate,
    dueDate: optionalDate,
    estimatedHours: z
      .union([z.string(), z.number()])
      .optional()
      .transform((value) => {
        if (value === "" || value === null || value === undefined) return null;
        return Number(value);
      })
      .refine((value) => value === null || (Number.isFinite(value) && value >= 0), {
        message: "Enter an estimate of 0 or more hours.",
      }),
  })
  .refine((values) => !(values.startDate && values.dueDate) || values.dueDate >= values.startDate, {
    path: ["dueDate"],
    message: "The due date can't be before the start date.",
  });

export function taskToFormValues(task, defaults = {}) {
  return {
    title: task?.title ?? "",
    description: task?.description ?? "",
    status: toUiStatus("taskStatus", task?.status) ?? defaults.status ?? "TODO",
    priority: toUiStatus("priority", task?.priority) ?? "MEDIUM",
    assigneeId: task?.assigneeId ?? "",
    phaseId: task?.phaseId ?? defaults.phaseId ?? "",
    milestoneId: task?.milestoneId ?? defaults.milestoneId ?? "",
    parentTaskId: task?.parentTaskId ?? defaults.parentTaskId ?? "",
    startDate: toDateInputValue(task?.startDate),
    dueDate: toDateInputValue(task?.dueDate),
    estimatedHours: task?.estimatedHours ?? "",
  };
}

export function toCreateTaskVariables(values, projectId, phaseId) {
  return {
    projectId,
    phaseId,
    title: values.title,
    description: values.description,
    milestoneId: values.milestoneId || undefined,
    parentTaskId: values.parentTaskId || undefined,
    assigneeId: values.assigneeId || undefined,
    status: mapTaskStatus(values.status),
    priority: mapPriority(values.priority),
    startDate: toApiDate(values.startDate),
    dueDate: toApiDate(values.dueDate),
    estimatedHours: values.estimatedHours ?? undefined,
  };
}

export function toUpdateTaskVariables(taskId, values) {
  return {
    id: taskId,
    title: values.title,
    description: values.description,
    status: mapTaskStatus(values.status),
    priority: mapPriority(values.priority),
    phaseId: values.phaseId || undefined,
    milestoneId: values.milestoneId || undefined,
    parentTaskId: values.parentTaskId || undefined,
    assigneeId: values.assigneeId || undefined,
    startDate: toApiDate(values.startDate),
    dueDate: toApiDate(values.dueDate),
    estimatedHours: values.estimatedHours ?? undefined,
  };
}

function mapTaskStatus(status) {
  const map = {
    TODO: "todo",
    IN_PROGRESS: "in_progress",
    REVIEW: "review",
    DONE: "done",
  };
  return map[status] ?? String(status).toLowerCase();
}

function mapPriority(priority) {
  return String(priority).toLowerCase();
}
