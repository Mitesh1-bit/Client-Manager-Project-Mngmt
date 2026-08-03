"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { FormField } from "@/app/components/domain/form-field";
import { MultiSelect, SelectedChips } from "@/app/components/domain/multi-select";
import { SectionCard } from "@/app/components/domain/states";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  CreateCompanyDocument,
  UpdateCompanyDocument,
} from "@/app/lib/graphql/generated/documents";
import { listStatuses } from "@/app/lib/status";

import {
  COMPANY_SIZES,
  TIMEZONES,
  companySchema,
  companyToFormValues,
  toCompanyInput,
  toCreateCompanyVariables,
  toUpdateCompanyVariables,
} from "./company-schema";

const STATUS_OPTIONS = listStatuses("companyStatus");

/**
 * Create and edit share one form. This is the reference form pattern for the
 * app: RHF + Zod resolver, `<FormField>` for label/hint/error wiring, sections
 * in `<SectionCard>`, server errors surfaced above the actions, and a sticky
 * action bar so Save is always reachable on a long form.
 *
 * @param {{ mode: 'create' | 'edit', company?: unknown, owners: unknown[], tags: unknown[] }} props
 */
export function CompanyForm({ mode, company, owners = [], tags = [] }) {
  const router = useRouter();
  const [serverError, setServerError] = useState(null);

  const [createCompany] = useMutation(CreateCompanyDocument);
  const [updateCompany] = useMutation(UpdateCompanyDocument);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(companySchema),
    defaultValues: companyToFormValues(company),
  });

  const tagOptions = tags.map((tag) => ({ value: tag.id, label: tag.name }));
  const cancelHref = mode === "edit" ? `/companies/${company.id}` : "/companies";

  async function onSubmit(values) {
    setServerError(null);
    const input = toCompanyInput(values);

    try {
      if (mode === "create") {
        const { data } = await createCompany({
          variables: toCreateCompanyVariables(values),
          update: (cache) => cache.evict({ fieldName: "companies" }),
        });
        toast.success(`${data.createCompany.name} created`);
        router.push(`/companies/${data.createCompany.id}`);
      } else {
        const { data } = await updateCompany({ variables: toUpdateCompanyVariables(company.id, values) });
        toast.success(`${data.updateCompany.name} updated`);
        router.push(`/companies/${company.id}`);
      }
      router.refresh();
    } catch (error) {
      setServerError(error?.message ?? "We couldn't save this company. Try again.");
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5" data-tour="company-form">
      <SectionCard title="Identity" description="How this company appears everywhere in the app.">
        <div className="grid gap-5 sm:grid-cols-2">
          <div data-tour="company-field-name" className="sm:col-span-2">
          <FormField label="Company name" error={errors.name?.message} required className="sm:col-span-2">
            {(field) => (
              <Input {...field} {...register("name")} className="h-10" placeholder="Northwind Health" autoFocus />
            )}
          </FormField>
          </div>

          <div data-tour="company-field-industry">
          <FormField label="Industry" error={errors.industry?.message}>
            {(field) => (
              <Input {...field} {...register("industry")} className="h-10" placeholder="Healthcare" />
            )}
          </FormField>
          </div>

          <div data-tour="company-field-website">
          <FormField
            label="Website"
            hint="We'll add https:// if you leave it off."
            error={errors.website?.message}
          >
            {(field) => (
              <Input {...field} {...register("website")} className="h-10" placeholder="northwind.health" />
            )}
          </FormField>
          </div>

          <FormField label="Company size" error={errors.size?.message}>
            {(field) => (
              <Controller
                control={control}
                name="size"
                render={({ field: control_ }) => (
                  <Select value={control_.value} onValueChange={control_.onChange}>
                    <SelectTrigger {...field} className="h-10 w-full">
                      <SelectValue placeholder="Not set" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPANY_SIZES.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size} employees
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
          </FormField>

          <FormField label="Timezone" error={errors.timezone?.message}>
            {(field) => (
              <Controller
                control={control}
                name="timezone"
                render={({ field: control_ }) => (
                  <Select value={control_.value} onValueChange={control_.onChange}>
                    <SelectTrigger {...field} className="h-10 w-full">
                      <SelectValue placeholder="Not set" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((zone) => (
                        <SelectItem key={zone} value={zone}>
                          {zone.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
          </FormField>
        </div>
      </SectionCard>

      <SectionCard
        title="Relationship"
        description="Who owns this account, where it sits in the lifecycle, and how it's tagged."
      >
        <div className="grid gap-5 sm:grid-cols-2" data-tour="company-field-status">
          <FormField label="Status" error={errors.status?.message} required>
            {(field) => (
              <Controller
                control={control}
                name="status"
                render={({ field: control_ }) => (
                  <Select value={control_.value} onValueChange={control_.onChange}>
                    <SelectTrigger {...field} className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
          </FormField>

          <FormField label="Account owner" error={errors.accountOwnerId?.message}>
            {(field) => (
              <Controller
                control={control}
                name="accountOwnerId"
                render={({ field: control_ }) => (
                  <Select value={control_.value} onValueChange={control_.onChange}>
                    <SelectTrigger {...field} className="h-10 w-full">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      {owners.map((owner) => (
                        <SelectItem key={owner.id} value={owner.id}>
                          {owner.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
          </FormField>

          <FormField label="Tags" error={errors.tagIds?.message} className="sm:col-span-2">
            {(field) => (
              <Controller
                control={control}
                name="tagIds"
                render={({ field: control_ }) => (
                  <div className="space-y-2">
                    <MultiSelect
                      {...field}
                      options={tagOptions}
                      value={control_.value}
                      onChange={control_.onChange}
                      placeholder="No tags"
                      emptyText="No tags defined yet."
                    />
                    <SelectedChips
                      options={tagOptions}
                      value={control_.value}
                      onRemove={(tagId) =>
                        control_.onChange(control_.value.filter((id) => id !== tagId))
                      }
                    />
                  </div>
                )}
              />
            )}
          </FormField>
        </div>
      </SectionCard>

      <SectionCard title="Address" description="Optional — used on contracts and invoices.">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Address line 1" error={errors.address?.line1?.message} className="sm:col-span-2">
            {(field) => <Input {...field} {...register("address.line1")} className="h-10" />}
          </FormField>
          <FormField label="Address line 2" error={errors.address?.line2?.message} className="sm:col-span-2">
            {(field) => <Input {...field} {...register("address.line2")} className="h-10" />}
          </FormField>
          <FormField label="City" error={errors.address?.city?.message}>
            {(field) => <Input {...field} {...register("address.city")} className="h-10" />}
          </FormField>
          <FormField label="Region or state" error={errors.address?.region?.message}>
            {(field) => <Input {...field} {...register("address.region")} className="h-10" />}
          </FormField>
          <FormField label="Postal code" error={errors.address?.postalCode?.message}>
            {(field) => <Input {...field} {...register("address.postalCode")} className="h-10" />}
          </FormField>
          <FormField label="Country" error={errors.address?.country?.message}>
            {(field) => <Input {...field} {...register("address.country")} className="h-10" />}
          </FormField>
        </div>
      </SectionCard>

      {serverError ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t save</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="sticky bottom-0 z-20 -mx-(--content-gutter) border-t bg-background/90 px-(--content-gutter) backdrop-blur" data-tour="company-field-save">
        <div className="flex items-center justify-end gap-2 py-3">
          {isDirty ? (
            <p className="mr-auto text-caption text-muted-foreground">Unsaved changes</p>
          ) : null}
          <Button type="button" variant="ghost" asChild>
            <Link href={cancelHref}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <LoaderCircle aria-hidden="true" className="animate-spin" />
                Saving…
              </>
            ) : mode === "create" ? (
              "Create company"
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
