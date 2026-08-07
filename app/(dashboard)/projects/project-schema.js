import { z } from "zod";

import { toApiStatus, toUiStatus } from "@/app/lib/api/normalize";
import { toApiDate, toDateInputValue } from "@/app/lib/date-input";

/**
 * Client-side validation for the project form. Mirrors `ProjectInput`; the API
 * stays the source of truth.
 */

/** Mirrors the backend's `Currency` enum (app/db/enums.py) — a closed set, like status/priority. */
export const CURRENCIES = [
  { value: "GBP", label: "GBP — British Pound" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "AUD", label: "AUD — Australian Dollar" },
  { value: "NZD", label: "NZD — New Zealand Dollar" },
  { value: "CHF", label: "CHF — Swiss Franc" },
  { value: "JPY", label: "JPY — Japanese Yen" },
  { value: "SEK", label: "SEK — Swedish Krona" },
  { value: "NOK", label: "NOK — Norwegian Krone" },
  { value: "DKK", label: "DKK — Danish Krone" },
  { value: "SGD", label: "SGD — Singapore Dollar" },
  { value: "HKD", label: "HKD — Hong Kong Dollar" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "ZAR", label: "ZAR — South African Rand" },
];

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
    currency: z.enum(CURRENCIES.map((c) => c.value)),
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
    companyId: project?.company?.id ?? project?.companyId ?? "",
    name: project?.name ?? "",
    description: project?.description ?? "",
    status: toUiStatus("projectStatus", project?.status) ?? "PLANNING",
    priority: toUiStatus("priority", project?.priority) ?? "MEDIUM",
    projectManagerId: project?.projectManager?.id ?? project?.projectManagerId ?? "",
    startDate: toDateInputValue(project?.startDate),
    endDate: toDateInputValue(project?.endDate),
    budget: project?.budget ?? "",
    currency: project?.currency ?? "GBP",
    tagIds: project?.tags?.map((tag) => tag.id) ?? [],
  };
}

/** Maps validated form values to backend createProject variables. */
export function toCreateProjectVariables(values) {
  return {
    companyId: values.companyId,
    name: values.name,
    description: values.description,
    status: toApiStatus("projectStatus", values.status),
    priority: values.priority ? String(values.priority).toLowerCase() : null,
    projectManagerId: values.projectManagerId || null,
    startDate: toApiDate(values.startDate),
    endDate: toApiDate(values.endDate),
    budget: values.budget,
    currency: values.currency,
    health: toApiStatus("projectHealth", "ON_TRACK"),
  };
}

/** Maps validated form values to backend updateProject variables. */
export function toUpdateProjectVariables(id, values) {
  return {
    id,
    name: values.name,
    description: values.description,
    status: toApiStatus("projectStatus", values.status),
    priority: values.priority ? String(values.priority).toLowerCase() : null,
    projectManagerId: values.projectManagerId || null,
    startDate: toApiDate(values.startDate),
    endDate: toApiDate(values.endDate),
    budget: values.budget,
    currency: values.currency,
    health: toApiStatus("projectHealth", "ON_TRACK"),
  };
}
