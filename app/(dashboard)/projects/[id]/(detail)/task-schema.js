import { z } from "zod";

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
    status: task?.status ?? defaults.status ?? "TODO",
    priority: task?.priority ?? "MEDIUM",
    assigneeId: task?.assignee?.id ?? "",
    phaseId: task?.phase?.id ?? defaults.phaseId ?? "",
    milestoneId: task?.milestone?.id ?? defaults.milestoneId ?? "",
    parentTaskId: task?.parentTask?.id ?? defaults.parentTaskId ?? "",
    startDate: task?.startDate ?? "",
    dueDate: task?.dueDate ?? "",
    estimatedHours: task?.estimatedHours ?? "",
  };
}

export function toTaskInput(values, projectId) {
  return { ...values, projectId };
}
