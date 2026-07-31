import { z } from "zod";

/**
 * Client-side validation for the project form. Mirrors `ProjectInput`; the API
 * stays the source of truth.
 */

const optionalText = (max, message) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => value || null);

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || null);

export const projectSchema = z
  .object({
    companyId: z.string().min(1, "Choose the client this project is for."),
    name: z
      .string()
      .trim()
      .min(2, "Give the project a name of at least 2 characters.")
      .max(120, "Keep the name under 120 characters."),
    description: optionalText(1000, "Keep this under 1000 characters."),
    status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    projectManagerId: z.string().optional().transform((value) => value || null),
    startDate: optionalDate,
    endDate: optionalDate,
    budget: z
      .union([z.string(), z.number()])
      .optional()
      .transform((value) => {
        if (value === "" || value === null || value === undefined) return null;
        return Number(value);
      })
      .refine((value) => value === null || (Number.isFinite(value) && value >= 0), {
        message: "Enter a budget of 0 or more.",
      }),
    tagIds: z.array(z.string()).default([]),
  })
  // Caught here so the user sees it before the round trip; the server checks
  // it too (a date can be changed by someone else between load and save).
  .refine((values) => !(values.startDate && values.endDate) || values.endDate >= values.startDate, {
    path: ["endDate"],
    message: "The end date can't be before the start date.",
  });

export function projectToFormValues(project) {
  return {
    companyId: project?.company?.id ?? "",
    name: project?.name ?? "",
    description: project?.description ?? "",
    status: project?.status ?? "PLANNING",
    priority: project?.priority ?? "MEDIUM",
    projectManagerId: project?.projectManager?.id ?? "",
    startDate: project?.startDate ?? "",
    endDate: project?.endDate ?? "",
    budget: project?.budget ?? "",
    tagIds: project?.tags?.map((tag) => tag.id) ?? [],
  };
}
