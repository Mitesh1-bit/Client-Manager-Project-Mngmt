"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { FormField } from "@/app/components/domain/form-field";
import { MultiSelect, SelectedChips } from "@/app/components/domain/multi-select";
import {
  SearchableSelect,
  shouldUseSearchableSelect,
} from "@/app/components/domain/searchable-select";
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
  AddTagDocument,
  CreateCompanyDocument,
  CreateTagDocument,
  RemoveTagDocument,
  UpdateCompanyDocument,
} from "@/app/lib/graphql/generated/documents";
import { syncEntityTags } from "@/app/lib/api/tag-sync";
import { listStatuses } from "@/app/lib/status";

import {
  companySchema,
  companyToFormValues,
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
 * @param {{ mode: 'create' | 'edit', company?: unknown, owners: unknown[], tags: unknown[], sizes: unknown[], industries: unknown[] }} props
 */
export function CompanyForm({ mode, company, owners = [], tags = [], sizes = [], industries = [] }) {
  const router = useRouter();
  const [serverError, setServerError] = useState(null);
  const [timezoneOptions, setTimezoneOptions] = useState([]);
  const [countryOptions, setCountryOptions] = useState([]);

  useEffect(() => {
    let active = true;
    import("@/app/lib/geo-options")
      .then((mod) => {
        if (!active) return;
        setTimezoneOptions(mod.getTimezoneOptions());
        setCountryOptions(mod.getCountryOptions());
      })
      .catch(() => {
        if (!active) return;
        setTimezoneOptions([]);
        setCountryOptions([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const [createCompany] = useMutation(CreateCompanyDocument);
  const [updateCompany] = useMutation(UpdateCompanyDocument);
  const [createTag] = useMutation(CreateTagDocument);
  const [addTag] = useMutation(AddTagDocument);
  const [removeTag] = useMutation(RemoveTagDocument);
  const [tagList, setTagList] = useState(tags);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(companySchema),
    defaultValues: companyToFormValues(company),
  });

  const tagOptions = tagList.map((tag) => ({ value: tag.id, label: tag.name }));
  const ownerOptions = owners.map((owner) => ({ value: owner.id, label: owner.name }));
  const cancelHref = mode === "edit" ? `/companies/${company.id}` : "/companies";

  async function handleCreateTag(name) {
    const { data } = await createTag({ variables: { name } });
    const tag = data.createTag;
    setTagList((current) => [...current, tag]);
    return { value: tag.id, label: tag.name };
  }

  async function onSubmit(values) {
    setServerError(null);

    try {
      let entityId;
      if (mode === "create") {
        const { data } = await createCompany({
          variables: toCreateCompanyVariables(values),
          update: (cache) => cache.evict({ fieldName: "companies" }),
        });
        entityId = data.createCompany.id;
        toast.success(`${data.createCompany.name} created`);
        router.push(`/companies/${entityId}`);
      } else {
        const { data } = await updateCompany({ variables: toUpdateCompanyVariables(company.id, values) });
        entityId = company.id;
        toast.success(`${data.updateCompany.name} updated`);
        router.push(`/companies/${entityId}`);
      }
      await syncEntityTags({
        addTag,
        removeTag,
        entityType: "company",
        entityId,
        previousTagIds: mode === "edit" ? (company?.tags ?? []).map((tag) => tag.id) : [],
        nextTagIds: values.tagIds,
      });
      router.refresh();
    } catch (error) {
      setServerError(error?.message ?? "We couldn't save this client. Try again.");
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5" data-tour="company-form">
      <SectionCard title="Identity" description="How this client appears everywhere in the app.">
        <div className="grid gap-5 sm:grid-cols-2">
          <div data-tour="company-field-name" className="sm:col-span-2">
          <FormField label="Client name" error={errors.name?.message} required className="sm:col-span-2">
            {(field) => (
              <Input {...field} {...register("name")} className="h-10" placeholder="Northwind Health" autoFocus />
            )}
          </FormField>
          </div>

          <div data-tour="company-field-industry">
          <FormField label="Industry" error={errors.industry?.message}>
            {(field) => (
              <Controller
                control={control}
                name="industry"
                render={({ field: control_ }) => (
                  <Select value={control_.value} onValueChange={control_.onChange}>
                    <SelectTrigger {...field} className="h-10 w-full">
                      <SelectValue placeholder="Not set" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry.id} value={industry.name}>
                          {industry.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
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

          <FormField label="Client size" error={errors.size?.message}>
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
                      {sizes.map((size) => (
                        <SelectItem key={size.id} value={size.label}>
                          {size.label} employees
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
                  <SearchableSelect
                    {...field}
                    options={timezoneOptions}
                    value={control_.value ?? ""}
                    onChange={control_.onChange}
                    placeholder="Search timezones…"
                    emptyText="No timezone matches."
                    allowClear
                    clearLabel="Not set"
                  />
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
                render={({ field: control_ }) =>
                  shouldUseSearchableSelect(ownerOptions) ? (
                    <SearchableSelect
                      {...field}
                      options={ownerOptions}
                      value={control_.value ?? ""}
                      onChange={control_.onChange}
                      placeholder="Search team members…"
                      emptyText="No team member matches."
                      allowClear
                      clearLabel="Unassigned"
                    />
                  ) : (
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
                  )
                }
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
                      onCreate={handleCreateTag}
                      placeholder="No tags"
                      emptyText="No tags yet — type a name to create one."
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
            {(field) => (
              <Controller
                control={control}
                name="address.country"
                render={({ field: control_ }) => (
                  <SearchableSelect
                    {...field}
                    options={countryOptions}
                    value={control_.value ?? ""}
                    onChange={control_.onChange}
                    placeholder="Search countries…"
                    emptyText="No country matches."
                    allowClear
                    clearLabel="Not set"
                  />
                )}
              />
            )}
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
              "Create client"
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
