"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { LoaderCircle, Plus } from "lucide-react";
import { toast } from "sonner";

import { FormField } from "@/app/components/domain/form-field";
import { SearchableSelect } from "@/app/components/domain/searchable-select";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import { CreateChangeRequestDocument } from "@/app/lib/graphql/generated/documents";

import {
  CHANGE_REQUEST_TYPES,
  humanizeChangeRequestType,
  newChangeRequestSchema,
  slugifyChangeRequestType,
  toCreateChangeRequestVariables,
} from "./new-change-request-schema";

/**
 * Logs a change request on a client's behalf — for when they call or message
 * a PM directly instead of raising it through the portal themselves. Same
 * mutation the portal form uses; this is just the internal-facing entry
 * point, which never existed before (portal was the only way in).
 *
 * @param {{
 *   projects: Array<{ id: string, name: string, companyId?: string }>,
 *   lockedProjectId?: string,
 *   lockedProjectName?: string,
 *   trigger?: React.ReactNode,
 * }} props
 */
export function NewChangeRequestDialog({
  projects = [],
  lockedProjectId = "",
  lockedProjectName = "",
  trigger,
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [createChangeRequest, { loading }] = useMutation(CreateChangeRequestDocument);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(newChangeRequestSchema),
    defaultValues: {
      projectId: lockedProjectId,
      type: "scope_addition",
      title: "",
      description: "",
      priority: "MEDIUM",
      desiredDueDate: "",
    },
  });

  const projectOptions = useMemo(
    () => projects.map((project) => ({ value: project.id, label: project.name })),
    [projects],
  );

  async function onSubmit(values) {
    setServerError(null);
    try {
      const { data } = await createChangeRequest({
        variables: toCreateChangeRequestVariables(values),
        update: (cache) => cache.evict({ fieldName: "changeRequests" }),
      });
      toast.success("Change request logged");
      setOpen(false);
      reset({
        projectId: lockedProjectId,
        type: "scope_addition",
        title: "",
        description: "",
        priority: "MEDIUM",
        desiredDueDate: "",
      });
      router.push(`/change-requests/${data.createChangeRequest.id}`);
      router.refresh();
    } catch (error) {
      setServerError(error?.message ?? "We couldn't log this. Try again.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setServerError(null);
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus aria-hidden="true" />
            New change request
          </Button>
        )}
      </DialogTrigger>
      <DialogContent size="form">
        <DialogHeader>
          <DialogTitle>Log a change request</DialogTitle>
          <DialogDescription>
            For when a client asks for something by phone, email or in person instead of raising it
            themselves through the portal.
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError ? (
            <Alert variant="destructive">
              <AlertTitle>Couldn&apos;t log that</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            {lockedProjectId ? (
              <FormField label="Project" className="sm:col-span-2">
                {() => (
                  <p className="flex h-10 items-center rounded-lg border bg-muted px-3 text-caption font-medium">
                    {lockedProjectName || "This project"}
                  </p>
                )}
              </FormField>
            ) : (
              <FormField label="Project" error={errors.projectId?.message} required className="sm:col-span-2">
                {(field) => (
                  <Controller
                    control={control}
                    name="projectId"
                    render={({ field: control_ }) => (
                      <SearchableSelect
                        {...field}
                        options={projectOptions}
                        value={control_.value ?? ""}
                        onChange={control_.onChange}
                        placeholder="Which project is this for?"
                        emptyText="No project matches."
                      />
                    )}
                  />
                )}
              </FormField>
            )}

            <FormField label="What kind of change?" error={errors.type?.message} required>
              {(field) => (
                <Controller
                  control={control}
                  name="type"
                  render={({ field: control_ }) => (
                    <SearchableSelect
                      {...field}
                      options={CHANGE_REQUEST_TYPES}
                      value={control_.value ?? ""}
                      onChange={control_.onChange}
                      placeholder="Choose or describe it"
                      emptyText="Type to describe a custom kind of change."
                      allowCustom
                      createLabel={(text) => `Use "${text}"`}
                      normalizeCustomValue={slugifyChangeRequestType}
                      formatUnknownValue={humanizeChangeRequestType}
                    />
                  )}
                />
              )}
            </FormField>

            <FormField label="How urgent is this?" error={errors.priority?.message}>
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
                        <SelectItem value="LOW">Low — no rush</SelectItem>
                        <SelectItem value="MEDIUM">Medium — normal priority</SelectItem>
                        <SelectItem value="HIGH">High — fairly urgent</SelectItem>
                        <SelectItem value="URGENT">Urgent — time-critical</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
            </FormField>

            <FormField label="Title" error={errors.title?.message} required className="sm:col-span-2">
              {(field) => (
                <Input
                  {...field}
                  {...register("title")}
                  className="h-10"
                  placeholder="Add insurance eligibility check to booking"
                  autoFocus
                />
              )}
            </FormField>

            <FormField
              label="Notes"
              hint="What they asked for, and any context — optional."
              error={errors.description?.message}
              className="sm:col-span-2"
            >
              {(field) => <Textarea {...field} {...register("description")} rows={4} />}
            </FormField>

            <FormField
              label="Ideally by"
              hint="Optional — if they gave you a date."
              error={errors.desiredDueDate?.message}
            >
              {(field) => <Input {...field} {...register("desiredDueDate")} type="date" className="h-10" />}
            </FormField>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <Plus aria-hidden="true" />}
              Log change request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
