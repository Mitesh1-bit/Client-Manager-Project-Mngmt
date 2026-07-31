import { z } from "zod";

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
    status: phase?.status ?? "NOT_STARTED",
    startDate: phase?.startDate ?? "",
    dueDate: phase?.dueDate ?? "",
  };
}

export function milestoneToFormValues(milestone, defaults = {}) {
  return {
    phaseId: milestone?.phase?.id ?? defaults.phaseId ?? "",
    title: milestone?.title ?? "",
    description: milestone?.description ?? "",
    dueDate: milestone?.dueDate ?? "",
    requiresClientApproval: milestone?.requiresClientApproval ?? false,
  };
}
