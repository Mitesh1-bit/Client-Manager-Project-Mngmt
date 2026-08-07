import { z } from "zod";
import { SEQUENCE_ASSIGNEE_ROLES } from "@/app/lib/assignee-roles";
import { toUiStatus } from "@/app/lib/api/normalize";

/**
 * Client-side validation for the sequence builder. Mirrors the rules the mock
 * resolver enforces in `toSequenceSteps()` (see NEEDED_SCHEMA_CHANGES.md
 * §9.1) so a mistake is caught while editing, not after a round trip.
 */

export const TRIGGER_TYPES = [
  { value: "MANUAL", label: "Manual — start it yourself for a client" },
  { value: "ON_COMPANY_CREATED", label: "When a new client is created" },
  { value: "ON_PROJECT_COMPLETED", label: "When a project completes" },
  { value: "ON_RENEWAL_APPROACHING", label: "As a renewal approaches" },
];

export const ASSIGNEE_ROLES = SEQUENCE_ASSIGNEE_ROLES;

const ASSIGNEE_ROLE_VALUES = ASSIGNEE_ROLES.map((role) => role.value);

const stepSchema = z.object({
  // Present only in client-side form state, for dnd-kit and RHF field
  // identity — never sent to the server, which assigns its own step ids.
  clientId: z.string(),
  // Set only for a step that already exists on the server (edit mode) — its
  // absence is how the submit handler tells a new step from an existing one.
  id: z.string().optional(),
  // Display-only — the API doesn't persist a step name, so this never round-trips.
  name: z
    .string()
    .trim()
    .max(80, "Keep the name under 80 characters.")
    .optional()
    .transform((value) => value || ""),
  channel: z.enum(["EMAIL", "CALL", "MEETING", "INTERNAL_TASK"]),
  offsetDays: z
    .union([z.string(), z.number()])
    .transform((value) => (value === "" ? NaN : Number(value)))
    .refine((value) => Number.isInteger(value) && value >= 0, {
      message: "Enter 0 or more whole days.",
    }),
  assigneeRole: z
    .enum(ASSIGNEE_ROLE_VALUES)
    .optional()
    .transform((value) => value || null),
  templateId: z.string().optional().transform((value) => value || null),
});

export const sequenceSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Give the sequence a name of at least 2 characters.")
      .max(100, "Keep the name under 100 characters."),
    description: z
      .string()
      .trim()
      .max(500, "Keep this under 500 characters.")
      .optional()
      .transform((value) => value || null),
    triggerType: z.enum([
      "MANUAL",
      "ON_COMPANY_CREATED",
      "ON_PROJECT_COMPLETED",
      "ON_RENEWAL_APPROACHING",
    ]),
    isActive: z.boolean().default(true),
    steps: z.array(stepSchema).min(1, "Add at least one step."),
  })
  // Mirrors the server: steps run in the order they're arranged in, so a
  // later step firing before an earlier one is a contradiction, not just an
  // unusual choice.
  .refine(
    (values) => values.steps.every((step, index) => index === 0 || step.offsetDays >= values.steps[index - 1].offsetDays),
    {
      path: ["steps"],
      message: "Steps must run in day order — drag a step to fix where it falls out of order.",
    },
  );

let clientIdCounter = 0;
export const nextClientId = () => `step_${Date.now()}_${++clientIdCounter}`;

export function sequenceToFormValues(sequence) {
  return {
    name: sequence?.name ?? "",
    description: sequence?.description ?? "",
    triggerType: toUiStatus("sequenceTriggerType", sequence?.triggerType) ?? "MANUAL",
    isActive: sequence?.isActive ?? true,
    steps: sequence?.steps?.length
      ? [...sequence.steps]
          .sort((a, b) => a.stepOrder - b.stepOrder)
          .map((step) => {
            const channel = toUiStatus("touchpointChannel", step.channel) ?? "CALL";
            return {
              clientId: nextClientId(),
              id: step.id,
              name: step.name ?? "",
              channel: channel === "EMAIL" ? "CALL" : channel,
              offsetDays: step.offsetDays,
              assigneeRole: step.assigneeRole ? String(step.assigneeRole).toUpperCase() : "",
              templateId: channel === "EMAIL" ? "" : (step.templateId ?? ""),
            };
          })
      : [
          {
            clientId: nextClientId(),
            name: "",
            channel: "CALL",
            offsetDays: 0,
            assigneeRole: "",
            templateId: "",
          },
        ],
  };
}

/** Drops the client-only `clientId` before the mutation goes out. */
export function toSequenceInput(values) {
  return {
    ...values,
    steps: values.steps.map(({ clientId: _clientId, ...step }) => step),
  };
}
