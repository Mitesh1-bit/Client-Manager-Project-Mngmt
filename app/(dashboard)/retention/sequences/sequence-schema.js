import { z } from "zod";
import { SEQUENCE_ASSIGNEE_ROLES } from "@/app/lib/assignee-roles";
import { toUiStatus } from "@/app/lib/api/normalize";

export const TRIGGER_TYPES = [
  { value: "ON_PROJECT_COMPLETED", label: "When a project completes (recommended)" },
  { value: "MANUAL", label: "Manual — start follow-ups yourself" },
];

export const SEQUENCE_STATUS_LABELS = {
  DRAFT: "Draft",
  PENDING: "Pending approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  ACTIVE: "Active",
};

export const SEQUENCE_SOURCE_LABELS = {
  AI: "AI generated",
  MANUAL: "Manual",
};

export const ASSIGNEE_ROLES = SEQUENCE_ASSIGNEE_ROLES;

const ASSIGNEE_ROLE_VALUES = ASSIGNEE_ROLES.map((role) => role.value);

const stepSchema = z.object({
  clientId: z.string(),
  id: z.string().optional(),
  name: z
    .string()
    .trim()
    .max(80, "Keep the name under 80 characters.")
    .optional()
    .transform((value) => value || ""),
  channel: z.enum(["EMAIL", "CALL"]),
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
  actionMessage: z
    .string()
    .trim()
    .max(1000, "Keep messaging under 1000 characters.")
    .optional()
    .transform((value) => value || null),
});

export const sequenceSchema = z
  .object({
    companyId: z.string().min(1, "Choose a client company."),
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
    triggerType: z.enum(["MANUAL", "ON_PROJECT_COMPLETED"]),
    isActive: z.boolean().default(false),
    steps: z.array(stepSchema).min(1, "Add at least one step."),
  })
  .refine(
    (values) =>
      values.steps.every(
        (step, index) => index === 0 || step.offsetDays >= values.steps[index - 1].offsetDays,
      ),
    {
      path: ["steps"],
      message: "Steps must run in day order — drag a step to fix where it falls out of order.",
    },
  );

let clientIdCounter = 0;
export const nextClientId = () => `step_${Date.now()}_${++clientIdCounter}`;

export function sequenceToFormValues(sequence) {
  return {
    companyId: sequence?.companyId ?? sequence?.company?.id ?? "",
    name: sequence?.name ?? "",
    description: sequence?.description ?? "",
    triggerType: toUiStatus("sequenceTriggerType", sequence?.triggerType) ?? "ON_PROJECT_COMPLETED",
    isActive: sequence?.isActive ?? false,
    steps: sequence?.steps?.length
      ? [...sequence.steps]
          .sort((a, b) => a.stepOrder - b.stepOrder)
          .map((step) => {
            const channel = toUiStatus("touchpointChannel", step.channel) ?? "CALL";
            return {
              clientId: nextClientId(),
              id: step.id,
              name: step.name ?? "",
              channel,
              offsetDays: step.offsetDays,
              assigneeRole: step.assigneeRole ? String(step.assigneeRole).toUpperCase() : "",
              templateId: step.templateId ?? "",
              actionMessage: step.actionMessage ?? "",
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
            actionMessage: "",
          },
        ],
  };
}

export function toSequenceInput(values) {
  return {
    ...values,
    steps: values.steps.map(({ clientId: _clientId, ...step }) => step),
  };
}

export function isSequenceEditable(sequence) {
  const status = toUiStatus("sequenceStatus", sequence?.status) ?? sequence?.status;
  return !["PENDING", "REJECTED"].includes(status);
}

export function isSequenceEnrollable(sequence) {
  const status = toUiStatus("sequenceStatus", sequence?.status) ?? sequence?.status;
  return ["APPROVED", "ACTIVE"].includes(status) && sequence?.isActive;
}
