import { z } from "zod";

import { toApiStatus, toUiStatus } from "@/app/lib/api/normalize";

/**
 * Client-side validation for the company form. The GraphQL schema (and the
 * service layer behind it) remains the source of truth — this exists to give
 * immediate feedback, not to enforce business rules.
 *
 * Kept in its own module so it can be unit tested without rendering the form.
 */

export const TIMEZONES = Intl.supportedValuesOf("timeZone");

const optionalText = (max, message) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => value || null);

/**
 * People type `northwind.health`, not `https://northwind.health`. Accept both
 * and normalise, rather than rejecting the shorter form.
 */
const websiteField = z
  .string()
  .trim()
  .optional()
  .transform((value) => {
    if (!value) return null;
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
  })
  .refine(
    (value) => value === null || /^https?:\/\/[^\s.]+\.[^\s]{2,}$/i.test(value),
    "Enter a valid website, like northwind.health",
  );

export const addressSchema = z.object({
  line1: optionalText(120, "Keep this under 120 characters."),
  line2: optionalText(120, "Keep this under 120 characters."),
  city: optionalText(80, "Keep this under 80 characters."),
  region: optionalText(80, "Keep this under 80 characters."),
  postalCode: optionalText(20, "Keep this under 20 characters."),
  country: optionalText(60, "Keep this under 60 characters."),
});

export const companySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Give the company a name of at least 2 characters.")
    .max(120, "Keep the name under 120 characters."),
  industry: optionalText(80, "Keep this under 80 characters."),
  website: websiteField,
  size: z.string().optional().transform((value) => value || null),
  timezone: z.string().optional().transform((value) => value || null),
  status: z.enum(["LEAD", "ACTIVE", "PAUSED", "CHURNED"]),
  accountOwnerId: z.string().optional().transform((value) => value || null),
  tagIds: z.array(z.string()).default([]),
  address: addressSchema,
});

/** Empty-string defaults keep the inputs controlled; the schema nulls them out. */
export function companyToFormValues(company) {
  return {
    name: company?.name ?? "",
    industry: company?.industry ?? "",
    website: company?.website ?? "",
    size: company?.size ?? "",
    timezone: company?.timezone ?? "",
    status: toUiStatus("companyStatus", company?.status) ?? "LEAD",
    accountOwnerId: company?.accountOwner?.id ?? "",
    tagIds: company?.tags?.map((tag) => tag.id) ?? [],
    address: {
      line1: company?.address?.line1 ?? "",
      line2: company?.address?.line2 ?? "",
      city: company?.address?.city ?? "",
      region: company?.address?.region ?? "",
      postalCode: company?.address?.postalCode ?? "",
      country: company?.address?.country ?? "",
    },
  };
}

/** Drops an all-empty address rather than sending a row of nulls. */
export function toCompanyInput(values) {
  const address = Object.values(values.address).some(Boolean) ? values.address : null;
  return { ...values, address };
}

/** Maps form values to backend createCompany variables. */
export function toCreateCompanyVariables(values) {
  const input = toCompanyInput(values);
  return {
    name: input.name,
    industry: input.industry,
    website: input.website,
    logoUrl: null,
    size: input.size,
    timezone: input.timezone,
    address: input.address,
    status: toApiStatus("companyStatus", input.status),
    accountOwnerId: input.accountOwnerId || null,
    healthScore: null,
  };
}

/** Maps form values to backend updateCompany variables. */
export function toUpdateCompanyVariables(id, values) {
  const input = toCompanyInput(values);
  return {
    id,
    name: input.name,
    industry: input.industry,
    website: input.website,
    logoUrl: null,
    size: input.size,
    timezone: input.timezone,
    address: input.address,
    status: toApiStatus("companyStatus", input.status),
    accountOwnerId: input.accountOwnerId || null,
    healthScore: null,
  };
}
