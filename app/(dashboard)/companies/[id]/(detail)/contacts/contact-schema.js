import { z } from "zod";

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
  doNotContact: z.boolean().default(false),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
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
  });

export function contactToFormValues(contact) {
  return {
    firstName: contact?.firstName ?? "",
    lastName: contact?.lastName ?? "",
    email: contact?.email ?? "",
    phone: contact?.phone ?? "",
    title: contact?.title ?? "",
    department: contact?.department ?? "",
    preferredChannel: contact?.preferredChannel ?? "",
    bestTimeToContact: contact?.bestTimeToContact ?? "",
    timezone: contact?.timezone ?? "",
    linkedinUrl: contact?.linkedinUrl ?? "",
    isPrimary: contact?.isPrimary ?? false,
    portalAccessEnabled: contact?.portalAccessEnabled ?? false,
    doNotContact: contact?.doNotContact ?? false,
    status: contact?.status ?? "ACTIVE",
  };
}

export function toContactInput(values, companyId) {
  return { ...values, companyId };
}
