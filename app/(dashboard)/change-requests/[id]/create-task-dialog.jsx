"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { LoaderCircle, ListChecks } from "lucide-react";
import { toast } from "sonner";

import { FormField } from "@/app/components/domain/form-field";
import { RoleAssigneeField } from "@/app/components/domain/role-assignee-field";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import {
  CreatePhaseDocument,
  CreateTaskDocument,
} from "@/app/lib/graphql/generated/documents";
import { listStatuses } from "@/app/lib/status";

import { SelectField } from "../../projects/[id]/task-form";
import { createTaskSchema, taskToFormValues, toCreateTaskVariables } from "../../projects/[id]/task-schema";

const PRIORITY_OPTIONS = listStatuses("priority");

/**
 * Spins up a task from an approved change request, keeping the link back so
 * the work stays traceable to what the client actually asked for. Same
 * `createTask` mutation the project board uses, just pre-filled and tagged
 * with `changeRequestId`.
 */
export function CreateTaskFromChangeRequestDialog({
  request,
  projectId,
  phases = [],
  milestones = [],
  tasks = [],
  users = [],
  boardColumns = [],
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [createTask] = useMutation(CreateTaskDocument);
  const [createPhase] = useMutation(CreatePhaseDocument);

  const statusOptions = useMemo(
    () => boardColumns.map((column) => ({ value: column.status, label: column.label })),
    [boardColumns],
  );
  const taskSchema = useMemo(() => createTaskSchema(boardColumns), [boardColumns]);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      ...taskToFormValues(null, { phaseId: phases[0]?.id ?? "" }, boardColumns),
      title: request.title,
      description: request.description ?? "",
      priority: request.priority ?? "MEDIUM",
      estimatedHours: request.impactHours ?? "",
    },
  });

  const phaseOptions = phases.map((phase) => ({ value: phase.id, label: phase.name }));
  const milestoneOptions = milestones.map((milestone) => ({ value: milestone.id, label: milestone.title }));
  // A task can't be its own parent, and we don't offer nesting under a subtask.
  const parentOptions = tasks.filter((candidate) => !candidate.parentTaskId);

  async function resolvePhaseId(values) {
    if (values.phaseId) return values.phaseId;
    if (phases.length > 0) return phases[0].id;
    const { data } = await createPhase({
      variables: { projectId, name: "General", orderIndex: 0, status: "not_started" },
    });
    return data.createPhase.id;
  }

  async function onSubmit(values) {
    setServerError(null);
    try {
      const phaseId = await resolvePhaseId(values);
      const { data } = await createTask({
        variables: { ...toCreateTaskVariables(values, projectId, phaseId), changeRequestId: request.id },
        update: (cache) => cache.evict({ id: cache.identify({ __typename: "ProjectType", id: projectId }) }),
      });
      toast.success(`"${data.createTask.title}" added to the board`);
      setOpen(false);
      reset();
      router.refresh();
    } catch (error) {
      setServerError(error?.message ?? "We couldn't create this task. Try again.");
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
        <Button variant="outline" size="sm">
          <ListChecks aria-hidden="true" />
          Create task
        </Button>
      </DialogTrigger>
      <DialogContent size="form">
        <DialogHeader>
          <DialogTitle>Create a task from this request</DialogTitle>
          <DialogDescription>
            Adds a task to the project board, linked back to this change request.
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError ? (
            <Alert variant="destructive">
              <AlertTitle>Couldn&apos;t create that</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          ) : null}

          <FormField label="Title" error={errors.title?.message} required>
            {(field) => <Input {...field} {...register("title")} className="h-10" autoFocus />}
          </FormField>

          <FormField label="Description" error={errors.description?.message}>
            {(field) => <Textarea {...field} {...register("description")} rows={3} />}
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              control={control}
              name="status"
              label="Status"
              required
              error={errors.status?.message}
              options={statusOptions}
            />

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

            <div className="sm:col-span-2">
              <RoleAssigneeField
                control={control}
                setValue={setValue}
                watch={watch}
                name="assigneeId"
                users={users}
                error={errors.assigneeId?.message}
              />
            </div>

            <FormField label="Phase" error={errors.phaseId?.message}>
              {(field) => (
                <Controller
                  control={control}
                  name="phaseId"
                  render={({ field: control_ }) => (
                    <SearchableSelect
                      {...field}
                      options={phaseOptions}
                      value={control_.value ?? ""}
                      onChange={control_.onChange}
                      placeholder={phases.length === 0 ? "No phases yet — one will be created" : "Choose a phase"}
                      emptyText="No phase matches."
                      disabled={phases.length === 0}
                    />
                  )}
                />
              )}
            </FormField>

            <SelectField
              control={control}
              name="milestoneId"
              label="Milestone"
              placeholder="No milestone"
              clearLabel="No milestone"
              error={errors.milestoneId?.message}
              options={milestoneOptions}
            />

            <SelectField
              control={control}
              name="parentTaskId"
              label="Parent task"
              placeholder="None — top-level task"
              clearLabel="None — top-level task"
              error={errors.parentTaskId?.message}
              options={parentOptions.map((candidate) => ({ value: candidate.id, label: candidate.title }))}
            />

            <FormField label="Start date" error={errors.startDate?.message}>
              {(field) => <Input {...field} {...register("startDate")} type="date" className="h-10" />}
            </FormField>

            <FormField label="Due date" error={errors.dueDate?.message}>
              {(field) => <Input {...field} {...register("dueDate")} type="date" className="h-10" />}
            </FormField>

            <FormField
              label="Estimate (hours)"
              hint={request.impactHours != null ? "Pre-filled from the assessment." : undefined}
              error={errors.estimatedHours?.message}
            >
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

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
              Create task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
