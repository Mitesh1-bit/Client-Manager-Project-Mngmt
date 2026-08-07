import { z } from "zod";

import { contactFullName, toApiStatus, toUiStatus } from "@/app/lib/api/normalize";

/**
 * Client-side validation for the contact form. Mirrors `ContactInput` in
 * schema.graphql; the API remains the source of truth (uniqueness of email, for
 * example, can only be decided server-side).
 */

export const PREFERRED_CHANNELS = [
  { value: "EMAIL", label: "Email" },
  { value: "PHONE", label: "Phone" },
  { value: "MEETING", label: "Meeting" },
];

const optionalText = (max, message) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => value || null);

export const contactSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "Enter a first name.")
    .max(60, "Keep this under 60 characters."),
  lastName: z
    .string()
    .trim()
    .min(1, "Enter a last name.")
    .max(60, "Keep this under 60 characters."),
  email: z
    .string()
    .trim()
    .min(1, "Enter an email address.")
    .email("That doesn't look like an email address."),
  phone: optionalText(40, "Keep this under 40 characters."),
  title: optionalText(80, "Keep this under 80 characters."),
  department: optionalText(80, "Keep this under 80 characters."),
  preferredChannel: z.string().optional().transform((value) => value || null),
  bestTimeToContact: optionalText(120, "Keep this under 120 characters."),
  timezone: z.string().optional().transform((value) => value || null),
  linkedinUrl: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? (/^https?:\/\//i.test(value) ? value : `https://${value}`) : null))
    .refine(
      (value) => value === null || /^https?:\/\/([\w-]+\.)+[\w-]{2,}(\/\S*)?$/i.test(value),
      "Enter a valid profile URL.",
    ),
  isPrimary: z.boolean().default(false),
  portalAccessEnabled: z.boolean().default(false),
  portalCanRaiseRequests: z.boolean().default(true),
  portalPassword: z.string().optional().transform((value) => value?.trim() || ""),
  doNotContact: z.boolean().default(false),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  tagIds: z.array(z.string()).default([]),
});

/**
 * A do-not-contact person shouldn't also be the primary contact, and giving
 * them portal access contradicts the flag. Caught here so the user sees it
 * before the round trip.
 */
export const contactFormSchema = contactSchema
  .refine((values) => !(values.doNotContact && values.isPrimary), {
    path: ["isPrimary"],
    message: "A do-not-contact person can't be the primary contact.",
  })
  .refine((values) => !(values.doNotContact && values.portalAccessEnabled), {
    path: ["portalAccessEnabled"],
    message: "Turn off do-not-contact before granting portal access.",
  })
  .refine((values) => !(values.status === "INACTIVE" && values.isPrimary), {
    path: ["isPrimary"],
    message: "An inactive contact can't be the primary contact.",
  })
  .refine(
    (values) =>
      !values.portalAccessEnabled || (values.portalPassword?.length ?? 0) >= 12,
    {
      path: ["portalPassword"],
      message: "Set a portal password of at least 12 characters.",
    },
  );

// Edit mode allows empty portal password (unchanged)
export const contactEditFormSchema = contactSchema
  .refine((values) => !(values.doNotContact && values.isPrimary), {
    path: ["isPrimary"],
    message: "A do-not-contact person can't be the primary contact.",
  })
  .refine((values) => !(values.doNotContact && values.portalAccessEnabled), {
    path: ["portalAccessEnabled"],
    message: "Turn off do-not-contact before granting portal access.",
  })
  .refine((values) => !(values.status === "INACTIVE" && values.isPrimary), {
    path: ["isPrimary"],
    message: "An inactive contact can't be the primary contact.",
  })
  .refine(
    (values) =>
      !values.portalAccessEnabled ||
      (values.portalPassword?.length ?? 0) === 0 ||
      (values.portalPassword?.length ?? 0) >= 12,
    {
      path: ["portalPassword"],
      message: "Portal password must be at least 12 characters.",
    },
  );

export function contactToFormValues(contact) {
  return {
    firstName: contact?.firstName ?? "",
    lastName: contact?.lastName ?? "",
    email: contact?.email ?? "",
    phone: contact?.phone ?? "",
    title: contact?.title ?? "",
    department: contact?.department ?? "",
    preferredChannel: toUiStatus("preferredChannel", contact?.preferredChannel) ?? "",
    bestTimeToContact: contact?.bestTimeToContact ?? "",
    timezone: contact?.timezone ?? "",
    linkedinUrl: contact?.linkedinUrl ?? "",
    isPrimary: contact?.isPrimary ?? false,
    portalAccessEnabled: contact?.portalAccessEnabled ?? false,
    portalCanRaiseRequests: contact?.portalCanRaiseRequests ?? true,
    portalPassword: "",
    doNotContact: contact?.doNotContact ?? false,
    status: toUiStatus("contactStatus", contact?.status) ?? "ACTIVE",
    tagIds: (contact?.tags ?? []).map((tag) => tag.id),
  };
}

export function toContactInput(values, companyId) {
  return { ...values, companyId };
}

export function toCreateContactVariables(values, companyId) {
  return {
    companyId,
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email.trim().toLowerCase(),
    phone: values.phone,
    title: values.title,
    department: values.department,
    isPrimary: values.isPrimary,
    preferredChannel: values.preferredChannel
      ? toApiStatus("preferredChannel", values.preferredChannel)
      : null,
    bestTimeToContact: values.bestTimeToContact,
    timezone: values.timezone,
    portalAccessEnabled: values.portalAccessEnabled,
    portalCanRaiseRequests: values.portalCanRaiseRequests,
    portalPassword: values.portalAccessEnabled && values.portalPassword ? values.portalPassword : null,
    linkedinUrl: values.linkedinUrl,
    status: toApiStatus("contactStatus", values.status),
  };
}

export function toUpdateContactVariables(id, values) {
  return {
    id,
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email.trim().toLowerCase(),
    phone: values.phone,
    title: values.title,
    department: values.department,
    isPrimary: values.isPrimary,
    preferredChannel: values.preferredChannel
      ? toApiStatus("preferredChannel", values.preferredChannel)
      : null,
    bestTimeToContact: values.bestTimeToContact,
    timezone: values.timezone,
    portalAccessEnabled: values.portalAccessEnabled,
    portalCanRaiseRequests: values.portalCanRaiseRequests,
    portalPassword: values.portalAccessEnabled && values.portalPassword ? values.portalPassword : null,
    linkedinUrl: values.linkedinUrl,
    status: toApiStatus("contactStatus", values.status),
  };
}

export { contactFullName };
