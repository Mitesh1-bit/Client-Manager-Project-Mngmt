"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { LoaderCircle, Send } from "lucide-react";
import { toast } from "sonner";

import { FormField } from "@/app/components/domain/form-field";
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
import { CreateChangeRequestDocument } from "@/app/lib/graphql/generated/documents";
import { toCreateChangeRequestVariables } from "@/app/lib/api/portal";

import { CHANGE_REQUEST_TYPES, changeRequestSchema } from "./change-request-schema";

/**
 * The client-side submission form — the start of the lifecycle this whole
 * phase is about. Deliberately plain-language: "add something new" rather
 * than `SCOPE_ADDITION`, because the person filling this in doesn't think in
 * our enum values.
 */
export function ChangeRequestForm({ projects }) {
  const router = useRouter();
  const [serverError, setServerError] = useState(null);
  const [createChangeRequest] = useMutation(CreateChangeRequestDocument);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(changeRequestSchema),
    defaultValues: {
      projectId: projects.length === 1 ? projects[0].id : "",
      type: "SCOPE_ADDITION",
      title: "",
      description: "",
      priority: "MEDIUM",
      desiredDueDate: "",
    },
  });

  async function onSubmit(values) {
    setServerError(null);
    try {
      const { data } = await createChangeRequest({
        variables: toCreateChangeRequestVariables(values),
      });
      const created = data.createChangeRequest;
      const reference = created.id.slice(0, 8);
      toast.success(`${reference} sent`, {
        description: "We'll come back to you with the impact shortly.",
      });
      router.push(`/portal/change-requests/${created.id}`);
      router.refresh();
    } catch (error) {
      setServerError(error?.message ?? "We couldn't send this. Try again.");
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {serverError ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t send that</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="rounded-2xl border bg-card p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Project" error={errors.projectId?.message} required>
            {(field) => (
              <Controller
                control={control}
                name="projectId"
                render={({ field: control_ }) => (
                  <Select value={control_.value} onValueChange={control_.onChange}>
                    <SelectTrigger {...field} className="h-10 w-full">
                      <SelectValue placeholder="Which project is this for?" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
          </FormField>

          <FormField label="What kind of change?" error={errors.type?.message} required>
            {(field) => (
              <Controller
                control={control}
                name="type"
                render={({ field: control_ }) => (
                  <Select value={control_.value} onValueChange={control_.onChange}>
                    <SelectTrigger {...field} className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANGE_REQUEST_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
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
            label="Tell us more"
            hint="What you need, and why — enough that we can size the work."
            error={errors.description?.message}
            required
            className="sm:col-span-2"
          >
            {(field) => <Textarea {...field} {...register("description")} rows={5} />}
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

          <FormField
            label="Ideally by"
            hint="Optional — we'll tell you if it's realistic."
            error={errors.desiredDueDate?.message}
          >
            {(field) => (
              <Input {...field} {...register("desiredDueDate")} type="date" className="h-10" />
            )}
          </FormField>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button type="submit" size="lg" disabled={isSubmitting} className="sm:w-auto">
          {isSubmitting ? (
            <LoaderCircle aria-hidden="true" className="animate-spin" />
          ) : (
            <Send aria-hidden="true" />
          )}
          Send request
        </Button>
      </div>
    </form>
  );
}
