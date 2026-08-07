import { z } from "zod";

/** Client-side validation for logging a change request on a client's behalf. Mirrors `ChangeRequestInput`. */

// Values are the backend's actual `type` strings — stored directly, no
// mapping step. A custom type (see `slugifyChangeRequestType` below) is
// stored the same way, so nothing downstream needs to know the difference.
export const CHANGE_REQUEST_TYPES = [
  { value: "scope_addition", label: "Add something new" },
  { value: "scope_reduction", label: "Remove or reduce something" },
  { value: "timeline_change", label: "Change a date" },
  { value: "budget_change", label: "Change the budget" },
  { value: "bugfix", label: "Something isn't working" },
  { value: "other", label: "Something else" },
];

/** Turns free-typed text into the same snake_case shape the preset types use. */
export function slugifyChangeRequestType(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

/** Undoes the above for display — snake_case back to a readable label. */
export function humanizeChangeRequestType(value) {
  if (!value) return "";
  const preset = CHANGE_REQUEST_TYPES.find((type) => type.value === value);
  if (preset) return preset.label;
  const spaced = value.replace(/_/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || null);

export const newChangeRequestSchema = z.object({
  projectId: z.string().min(1, "Choose which project this is for."),
  type: z
    .string()
    .trim()
    .min(1, "Choose or describe the kind of change.")
    .max(60, "Keep this under 60 characters."),
  title: z
    .string()
    .trim()
    .min(4, "Give it a short title — a few words is fine.")
    .max(140, "Keep the title under 140 characters."),
  // Logged from a phone call or a hallway conversation, so this stays short —
  // unlike the portal form, nobody's typing this out themselves.
  description: z
    .string()
    .trim()
    .max(3000, "Keep this under 3000 characters.")
    .optional()
    .transform((value) => value || null),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  desiredDueDate: optionalDate,
});

export function toCreateChangeRequestVariables(values) {
  const priorityMap = { LOW: "low", MEDIUM: "medium", HIGH: "high", URGENT: "urgent" };
  return {
    projectId: values.projectId,
    title: values.title,
    type: values.type,
    description: values.description || null,
    priority: priorityMap[values.priority] ?? String(values.priority).toLowerCase(),
    desiredDueDate: values.desiredDueDate || null,
  };
}
