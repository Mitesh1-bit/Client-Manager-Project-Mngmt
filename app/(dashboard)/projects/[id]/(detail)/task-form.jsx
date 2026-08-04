"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { LoaderCircle } from "lucide-react";
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
import { CreateTaskDocument, CreatePhaseDocument, UpdateTaskDocument } from "@/app/lib/graphql/generated/documents";
import { listStatuses } from "@/app/lib/status";

import { taskSchema, taskToFormValues, toCreateTaskVariables, toUpdateTaskVariables } from "./task-schema";

const STATUS_OPTIONS = listStatuses("taskStatus");
const PRIORITY_OPTIONS = listStatuses("priority");
const NONE = "__none__";

/**
 * Task create/edit. Rendered inside the task sheet, so it lays out as a
 * scrolling body with a pinned action row rather than a page.
 */
export function TaskForm({ projectId, task, defaults, phases = [], milestones = [], users = [], tasks = [], onDone, onCancel }) {
  const router = useRouter();
  const mode = task ? "edit" : "create";
  const [serverError, setServerError] = useState(null);

  const [createTask] = useMutation(CreateTaskDocument);
  const [createPhase] = useMutation(CreatePhaseDocument);
  const [updateTask] = useMutation(UpdateTaskDocument);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: taskToFormValues(task, defaults),
  });

  // A task can't be its own parent, and we don't offer nesting under a subtask.
  const parentOptions = tasks.filter(
    (candidate) => candidate.id !== task?.id && !candidate.parentTask,
  );

  async function resolvePhaseId(values) {
    if (values.phaseId) return values.phaseId;
    if (phases.length > 0) return phases[0].id;

    const { data } = await createPhase({
      variables: {
        projectId,
        name: "General",
        orderIndex: 0,
        status: "not_started",
      },
    });
    return data.createPhase.id;
  }

  async function onSubmit(values) {
    setServerError(null);

    try {
      if (mode === "create") {
        const phaseId = await resolvePhaseId(values);
        const { data } = await createTask({
          variables: toCreateTaskVariables(values, projectId, phaseId),
          update: (cache) =>
            cache.evict({ id: cache.identify({ __typename: "ProjectType", id: projectId }) }),
        });
        toast.success(`“${data.createTask.title}” added`);
      } else {
        const { data } = await updateTask({
          variables: toUpdateTaskVariables(task.id, values),
        });
        toast.success(`“${data.updateTask.title}” updated`);
      }
      router.refresh();
      onDone?.();
    } catch (error) {
      setServerError(error?.message ?? "We couldn't save this task. Try again.");
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
        {serverError ? (
          <Alert variant="destructive">
            <AlertTitle>Couldn&apos;t save</AlertTitle>
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        ) : null}

        <div data-tour="task-field-title">
          <FormField label="Title" error={errors.title?.message} required>
            {(field) => <Input {...field} {...register("title")} className="h-10" autoFocus />}
          </FormField>
        </div>

        <FormField label="Description" error={errors.description?.message}>
          {(field) => <Textarea {...field} {...register("description")} rows={3} />}
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <div data-tour="task-field-status">
            <SelectField
              control={control}
              name="status"
              label="Status"
              required
              error={errors.status?.message}
              options={STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label }))}
            />
          </div>
          <SelectField
            control={control}
            name="priority"
            label="Priority"
            required
            error={errors.priority?.message}
            options={PRIORITY_OPTIONS.map((p) => ({ value: p.value, label: p.label }))}
          />
          <div data-tour="task-field-assignee">
            <SelectField
              control={control}
              name="assigneeId"
              label="Assignee"
              placeholder="Unassigned"
              clearLabel="Unassigned"
              error={errors.assigneeId?.message}
              options={users.map((user) => ({ value: user.id, label: user.name }))}
            />
          </div>
          <SelectField
            control={control}
            name="parentTaskId"
            label="Parent task"
            placeholder="None — top-level task"
            clearLabel="None — top-level task"
            error={errors.parentTaskId?.message}
            options={parentOptions.map((candidate) => ({
              value: candidate.id,
              label: candidate.title,
            }))}
          />
          <div data-tour="task-field-schedule">
            <SelectField
              control={control}
              name="phaseId"
              label="Phase"
              placeholder="No phase"
              clearLabel="No phase"
              error={errors.phaseId?.message}
              options={phases.map((phase) => ({ value: phase.id, label: phase.name }))}
            />
          </div>
          <SelectField
            control={control}
            name="milestoneId"
            label="Milestone"
            placeholder="No milestone"
            clearLabel="No milestone"
            error={errors.milestoneId?.message}
            options={milestones.map((milestone) => ({
              value: milestone.id,
              label: milestone.title,
            }))}
          />
          <FormField label="Start date" error={errors.startDate?.message}>
            {(field) => <Input {...field} {...register("startDate")} type="date" className="h-10" />}
          </FormField>
          <FormField label="Due date" error={errors.dueDate?.message}>
            {(field) => <Input {...field} {...register("dueDate")} type="date" className="h-10" />}
          </FormField>
          <FormField label="Estimate (hours)" error={errors.estimatedHours?.message}>
            {(field) => (
              <Input
                {...field}
                {...register("estimatedHours")}
                type="number"
                min="0"
                step="0.5"
                className="h-10"
              />
            )}
          </FormField>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t px-5 py-3" data-tour="task-field-save">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <LoaderCircle aria-hidden="true" className="animate-spin" />
              Saving…
            </>
          ) : mode === "create" ? (
            "Add task"
          ) : (
            "Save changes"
          )}
        </Button>
      </div>
    </form>
  );
}

/**
 * Radix Select can't hold an empty-string value, so "none" travels as a
 * sentinel and is mapped back to "" for the form.
 */
function SelectField({ control, name, label, options, placeholder, clearLabel, error, required }) {
  return (
    <FormField label={label} error={error} required={required}>
      {(field) => (
        <Controller
          control={control}
          name={name}
          render={({ field: control_ }) => (
            <Select
              value={control_.value || NONE}
              onValueChange={(value) => control_.onChange(value === NONE ? "" : value)}
            >
              <SelectTrigger {...field} className="h-10 w-full">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {clearLabel ? <SelectItem value={NONE}>{clearLabel}</SelectItem> : null}
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      )}
    </FormField>
  );
}
