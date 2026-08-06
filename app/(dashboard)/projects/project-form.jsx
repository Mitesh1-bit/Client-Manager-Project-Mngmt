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
import { Textarea } from "@/app/components/ui/textarea";
import {
  CreateProjectDocument,
  CreateTagDocument,
  UpdateProjectDocument,
} from "@/app/lib/graphql/generated/documents";
import { listStatuses } from "@/app/lib/status";

import {
  CURRENCIES,
  projectSchema,
  projectToFormValues,
  toCreateProjectVariables,
  toUpdateProjectVariables,
} from "./project-schema";

const STATUS_OPTIONS = listStatuses("projectStatus");
const PRIORITY_OPTIONS = listStatuses("priority");

/**
 * Create and edit share one form, following the company form's conventions:
 * RHF + Zod, `<FormField>` for label/error wiring, sections in `<SectionCard>`,
 * server errors above a sticky action bar.
 */
export function ProjectForm({ mode, project, companies = [], users = [], tags = [] }) {
  const router = useRouter();
  const [serverError, setServerError] = useState(null);

  const [createProject] = useMutation(CreateProjectDocument);
  const [updateProject] = useMutation(UpdateProjectDocument);
  const [createTag] = useMutation(CreateTagDocument);
  const [tagList, setTagList] = useState(tags);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: projectToFormValues(project),
  });

  const tagOptions = tagList.map((tag) => ({ value: tag.id, label: tag.name }));
  const companyOptions = companies.map((company) => ({ value: company.id, label: company.name }));
  const userOptions = users.map((user) => ({ value: user.id, label: user.name }));
  const currencyOptions = CURRENCIES.map((currency) => ({
    value: currency.value,
    label: currency.label,
    searchText: currency.label.toLowerCase(),
  }));
  const cancelHref = mode === "edit" ? `/projects/${project.id}` : "/projects";

  async function handleCreateTag(name) {
    const { data } = await createTag({ variables: { name } });
    const tag = data.createTag;
    setTagList((current) => [...current, tag]);
    return { value: tag.id, label: tag.name };
  }

  async function onSubmit(input) {
    setServerError(null);
    try {
      if (mode === "create") {
        const { data } = await createProject({
          variables: toCreateProjectVariables(input),
          update: (cache) => cache.evict({ fieldName: "projects" }),
        });
        toast.success(`${data.createProject.name} created`);
        router.push(`/projects/${data.createProject.id}`);
      } else {
        const { data } = await updateProject({
          variables: toUpdateProjectVariables(project.id, input),
        });
        toast.success(`${data.updateProject.name} updated`);
        router.push(`/projects/${project.id}`);
      }
      router.refresh();
    } catch (error) {
      setServerError(error?.message ?? "We couldn't save this project. Try again.");
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5" data-tour="project-form">
      <SectionCard title="Basics" description="What this project is and who it's for.">
        <div className="grid gap-5 sm:grid-cols-2">
          <div data-tour="project-field-name" className="sm:col-span-2">
          <FormField label="Project name" error={errors.name?.message} required className="sm:col-span-2">
            {(field) => (
              <Input
                {...field}
                {...register("name")}
                className="h-10"
                placeholder="Patient Portal Redesign"
                autoFocus
              />
            )}
          </FormField>
          </div>

          <div data-tour="project-field-client">
          <FormField label="Client" error={errors.companyId?.message} required>
            {(field) => (
              <Controller
                control={control}
                name="companyId"
                render={({ field: control_ }) =>
                  shouldUseSearchableSelect(companyOptions) ? (
                    <SearchableSelect
                      {...field}
                      options={companyOptions}
                      value={control_.value ?? ""}
                      onChange={control_.onChange}
                      placeholder="Search clients…"
                      emptyText="No client matches."
                      disabled={mode === "edit"}
                    />
                  ) : (
                    <Select
                      value={control_.value}
                      onValueChange={control_.onChange}
                      disabled={mode === "edit"}
                    >
                      <SelectTrigger {...field} className="h-10 w-full">
                        <SelectValue placeholder="Choose a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                }
              />
            )}
          </FormField>
          </div>

          <div data-tour="project-field-pm">
          <FormField label="Project manager" error={errors.projectManagerId?.message}>
            {(field) => (
              <Controller
                control={control}
                name="projectManagerId"
                render={({ field: control_ }) =>
                  shouldUseSearchableSelect(userOptions) ? (
                    <SearchableSelect
                      {...field}
                      options={userOptions}
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
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                }
              />
            )}
          </FormField>
          </div>

          <div data-tour="project-field-description" className="sm:col-span-2">
          <FormField
            label="Description"
            error={errors.description?.message}
            className="sm:col-span-2"
          >
            {(field) => (
              <Textarea
                {...field}
                {...register("description")}
                rows={3}
                placeholder="What this project delivers, in a sentence or two."
              />
            )}
          </FormField>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Schedule and budget">
        <div className="grid gap-5 sm:grid-cols-2" data-tour="project-field-schedule">
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

          <FormField label="Priority" error={errors.priority?.message} required>
            {(field) => (
              <Controller
                control={control}
                name="priority"
                render={({ field: control_ }) => (
                  <Select value={control_.value} onValueChange={control_.onChange}>
                    <SelectTrigger {...field} className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
          </FormField>

          <FormField label="Start date" error={errors.startDate?.message}>
            {(field) => <Input {...field} {...register("startDate")} type="date" className="h-10" />}
          </FormField>

          <FormField label="End date" error={errors.endDate?.message}>
            {(field) => <Input {...field} {...register("endDate")} type="date" className="h-10" />}
          </FormField>

          <div data-tour="project-field-budget">
          <FormField label="Budget" hint="Excluding VAT." error={errors.budget?.message}>
            {(field) => (
              <Input
                {...field}
                {...register("budget")}
                type="number"
                min="0"
                step="100"
                className="h-10"
                placeholder="0"
              />
            )}
          </FormField>
          </div>

          <FormField label="Currency" error={errors.currency?.message}>
            {(field) => (
              <Controller
                control={control}
                name="currency"
                render={({ field: control_ }) => (
                  <SearchableSelect
                    {...field}
                    options={currencyOptions}
                    value={control_.value ?? ""}
                    onChange={control_.onChange}
                    placeholder="Search currencies…"
                    emptyText="No currency matches."
                  />
                )}
              />
            )}
          </FormField>

          <FormField label="Tags" error={errors.tagIds?.message}>
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

      {serverError ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t save</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="sticky bottom-0 z-20 -mx-(--content-gutter) border-t bg-background/90 px-(--content-gutter) backdrop-blur" data-tour="project-field-save">
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
              "Create project"
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
