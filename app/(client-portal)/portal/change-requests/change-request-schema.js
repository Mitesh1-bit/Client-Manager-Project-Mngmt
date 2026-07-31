import { z } from "zod";

/** Client-side validation for a new change request. Mirrors `ChangeRequestInput`. */

export const CHANGE_REQUEST_TYPES = [
  { value: "SCOPE_ADDITION", label: "Add something new" },
  { value: "SCOPE_REDUCTION", label: "Remove or reduce something" },
  { value: "TIMELINE_CHANGE", label: "Change a date" },
  { value: "BUDGET_CHANGE", label: "Change the budget" },
  { value: "BUGFIX", label: "Something isn't working" },
  { value: "OTHER", label: "Something else" },
];

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || null);

export const changeRequestSchema = z.object({
  projectId: z.string().min(1, "Choose which project this is for."),
  type: z.enum([
    "SCOPE_ADDITION",
    "SCOPE_REDUCTION",
    "TIMELINE_CHANGE",
    "BUDGET_CHANGE",
    "BUGFIX",
    "OTHER",
  ]),
  title: z
    .string()
    .trim()
    .min(4, "Give it a short title — a few words is fine.")
    .max(140, "Keep the title under 140 characters."),
  description: z
    .string()
    .trim()
    .min(20, "Tell us a bit more — enough that we can size the work without asking a follow-up.")
    .max(3000, "Keep this under 3000 characters."),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  desiredDueDate: optionalDate,
});

export function toChangeRequestInput(values) {
  return values;
}
