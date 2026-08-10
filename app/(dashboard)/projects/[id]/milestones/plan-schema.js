import { z } from "zod";

import { toUiStatus } from "@/app/lib/api/normalize";
import { toApiDate, toDateInputValue } from "@/app/lib/date-input";

/** Validation for the phase and milestone forms. Mirrors `PhaseInput` / `MilestoneInput`. */

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || null);

const optionalText = (max, message) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => value || null);

export const phaseSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Give the phase a name of at least 2 characters.")
      .max(80, "Keep the name under 80 characters."),
    status: z.enum(["NOT_STARTED", "IN_PROGRESS", "AT_RISK", "COMPLETED"]),
    startDate: optionalDate,
    dueDate: optionalDate,
  })
  .refine((values) => !(values.startDate && values.dueDate) || values.dueDate >= values.startDate, {
    path: ["dueDate"],
    message: "The end date can't be before the start date.",
  });

export const milestoneSchema = z.object({
  phaseId: z.string().min(1, "Choose the phase this milestone belongs to."),
  title: z
    .string()
    .trim()
    .min(2, "Give the milestone a title of at least 2 characters.")
    .max(160, "Keep the title under 160 characters."),
  description: optionalText(1000, "Keep this under 1000 characters."),
  dueDate: optionalDate,
  requiresClientApproval: z.boolean().default(false),
});

export function phaseToFormValues(phase) {
  return {
    name: phase?.name ?? "",
    status: toUiStatus("phaseStatus", phase?.status) ?? "NOT_STARTED",
    startDate: toDateInputValue(phase?.startDate),
    dueDate: toDateInputValue(phase?.dueDate),
  };
}

export function milestoneToFormValues(milestone, defaults = {}) {
  return {
    phaseId: milestone?.phase?.id ?? defaults.phaseId ?? "",
    title: milestone?.title ?? "",
    description: milestone?.description ?? "",
    dueDate: toDateInputValue(milestone?.dueDate),
    requiresClientApproval: milestone?.requiresClientApproval ?? false,
  };
}

function planStatusToApi(value) {
  return String(value ?? "NOT_STARTED").toLowerCase();
}

/** @param {ReturnType<typeof phaseToFormValues>} values */
export function toCreatePhaseVariables(values, projectId, orderIndex) {
  return {
    projectId,
    name: values.name,
    orderIndex,
    status: planStatusToApi(values.status),
    startDate: toApiDate(values.startDate),
    dueDate: toApiDate(values.dueDate),
  };
}

/** @param {ReturnType<typeof phaseToFormValues>} values */
export function toUpdatePhaseVariables(id, values, orderIndex) {
  return {
    id,
    name: values.name,
    orderIndex,
    status: planStatusToApi(values.status),
    startDate: toApiDate(values.startDate),
    dueDate: toApiDate(values.dueDate),
  };
}

/** @param {ReturnType<typeof milestoneToFormValues>} values */
export function toCreateMilestoneVariables(values, orderIndex) {
  return {
    phaseId: values.phaseId,
    title: values.title,
    description: values.description,
    orderIndex,
    status: "not_started",
    dueDate: toApiDate(values.dueDate),
    requiresClientApproval: values.requiresClientApproval,
  };
}

/** @param {ReturnType<typeof milestoneToFormValues>} values */
export function toUpdateMilestoneVariables(id, values) {
  return {
    id,
    title: values.title,
    description: values.description,
    dueDate: toApiDate(values.dueDate),
    requiresClientApproval: values.requiresClientApproval,
  };
}

/** @param {Array<{ id: string, milestones?: Array<unknown> }>} phases @param {string} phaseId */
export function milestoneOrderIndex(phases, phaseId) {
  const phase = phases.find((row) => row.id === phaseId);
  return phase?.milestones?.length ?? 0;
}
