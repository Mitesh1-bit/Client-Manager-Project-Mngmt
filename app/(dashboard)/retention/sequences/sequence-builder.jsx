"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { LoaderCircle, Plus } from "lucide-react";
import { toast } from "sonner";

import { FormField } from "@/app/components/domain/form-field";
import { SearchableSelect } from "@/app/components/domain/searchable-select";
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
  AddSequenceStepDocument,
  CreateRetentionSequenceDocument,
  RemoveSequenceStepDocument,
  ReorderSequenceStepsDocument,
  SubmitRetentionSequenceDocument,
  UpdateRetentionSequenceDocument,
  UpdateSequenceStepDocument,
} from "@/app/lib/graphql/generated/documents";

import { SequenceStepCard } from "./sequence-step-card";
import {
  TRIGGER_TYPES,
  isSequenceEditable,
  nextClientId,
  sequenceSchema,
  sequenceToFormValues,
  toSequenceInput,
} from "./sequence-schema";

function stepMutationVariables(step) {
  return {
    channel: step.channel.toLowerCase(),
    offsetDays: Number(step.offsetDays),
    templateId: step.templateId || null,
    assigneeRole: step.assigneeRole ? step.assigneeRole.toLowerCase() : null,
    name: step.name || null,
    actionMessage: step.actionMessage || null,
  };
}

export function SequenceBuilder({ mode, sequence, companies = [] }) {
  const router = useRouter();
  const [serverError, setServerError] = useState(null);
  const editable = mode === "create" || isSequenceEditable(sequence);

  const [createSequence] = useMutation(CreateRetentionSequenceDocument);
  const [updateSequence] = useMutation(UpdateRetentionSequenceDocument);
  const [addStep] = useMutation(AddSequenceStepDocument);
  const [updateStep] = useMutation(UpdateSequenceStepDocument);
  const [removeStep] = useMutation(RemoveSequenceStepDocument);
  const [reorderSteps] = useMutation(ReorderSequenceStepsDocument);
  const [submitSequence] = useMutation(SubmitRetentionSequenceDocument);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(sequenceSchema),
    defaultValues: sequenceToFormValues(sequence),
  });

  const { fields, append, remove, move } = useFieldArray({ control, name: "steps" });
  const channels = useWatch({ control, name: "steps" })?.map((step) => step.channel) ?? [];
  const offsets = useWatch({ control, name: "steps" })?.map((step) => Number(step.offsetDays)) ?? [];

  const companyOptions = useMemo(
    () => companies.map((company) => ({ value: company.id, label: company.name })),
    [companies],
  );

  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd({ active, over }) {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const from = fields.findIndex((field) => field.clientId === active.id);
    const to = fields.findIndex((field) => field.clientId === over.id);
    if (from !== -1 && to !== -1) move(from, to);
  }

  const totalDays = offsets.length ? Math.max(...offsets.filter((n) => Number.isFinite(n)), 0) : 0;
  const cancelHref = mode === "edit" ? `/retention/sequences/${sequence.id}` : "/retention/sequences";

  async function persistSteps(sequenceId, inputSteps, existingSteps = []) {
    const remainingIds = new Set(inputSteps.map((step) => step.id).filter(Boolean));
    const removedIds = existingSteps.map((step) => step.id).filter((id) => !remainingIds.has(id));
    for (const stepId of removedIds) {
      await removeStep({ variables: { stepId } });
    }

    const orderedStepIds = [];
    for (const step of inputSteps) {
      if (step.id) {
        await updateStep({ variables: { stepId: step.id, ...stepMutationVariables(step) } });
        orderedStepIds.push(step.id);
      } else {
        const { data } = await addStep({
          variables: { sequenceId, ...stepMutationVariables(step) },
        });
        orderedStepIds.push(data.addSequenceStep.id);
      }
    }

    if (orderedStepIds.length > 1) {
      await reorderSteps({ variables: { sequenceId, orderedStepIds } });
    }
  }

  async function saveSequence(values, submitForApproval = false) {
    setServerError(null);
    const input = toSequenceInput(values);

    try {
      if (mode === "create") {
        const { data } = await createSequence({
          variables: {
            name: input.name,
            companyId: input.companyId,
            description: input.description,
            triggerType: input.triggerType?.toLowerCase() ?? "manual",
            isTemplate: false,
            submitForApproval: false,
          },
          update: (cache) => cache.evict({ fieldName: "retentionSequences" }),
        });
        const sequenceId = data.createRetentionSequence.id;

        for (const step of input.steps) {
          await addStep({
            variables: { sequenceId, ...stepMutationVariables(step) },
          });
        }

        if (submitForApproval) {
          await submitSequence({ variables: { id: sequenceId } });
        }

        toast.success(
          submitForApproval
            ? `"${data.createRetentionSequence.name}" submitted for approval`
            : `"${data.createRetentionSequence.name}" saved as draft`,
        );
        router.push(`/retention/sequences/${sequenceId}`);
      } else {
        await updateSequence({
          variables: {
            id: sequence.id,
            name: input.name,
            description: input.description,
            companyId: input.companyId,
            triggerType: input.triggerType?.toLowerCase() ?? null,
            isActive: input.isActive,
          },
        });

        await persistSteps(sequence.id, input.steps, sequence.steps ?? []);

        if (submitForApproval) {
          await submitSequence({ variables: { id: sequence.id } });
        }

        toast.success(
          submitForApproval ? `"${input.name}" submitted for approval` : `"${input.name}" updated`,
        );
        router.push(`/retention/sequences/${sequence.id}`);
      }
      router.refresh();
    } catch (error) {
      setServerError(error?.message ?? "We couldn't save this sequence. Try again.");
    }
  }

  if (!editable && mode === "edit") {
    return (
      <Alert>
        <AlertTitle>This sequence can&apos;t be edited</AlertTitle>
        <AlertDescription>
          Pending and rejected sequences are read-only. Duplicate it to create a new draft.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form noValidate className="space-y-5">
      <SectionCard title="About this sequence">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Client company" error={errors.companyId?.message} required className="sm:col-span-2">
            {(field) => (
              <Controller
                control={control}
                name="companyId"
                render={({ field: control_ }) => (
                  <SearchableSelect
                    {...field}
                    options={companyOptions}
                    value={control_.value ?? ""}
                    onChange={control_.onChange}
                    placeholder="Choose a client company"
                    emptyText="No client matches."
                  />
                )}
              />
            )}
          </FormField>

          <FormField label="Name" error={errors.name?.message} required className="sm:col-span-2">
            {(field) => (
              <Input
                {...field}
                {...register("name")}
                className="h-10"
                placeholder="Client Onboarding"
                autoFocus
              />
            )}
          </FormField>

          <FormField label="Description" error={errors.description?.message} className="sm:col-span-2">
            {(field) => (
              <textarea
                {...field}
                {...register("description")}
                rows={2}
                placeholder="What this sequence is for and when to use it."
                className="flex min-h-[4.5rem] w-full rounded-lg border border-input bg-background px-3 py-2 text-caption shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            )}
          </FormField>

          <FormField label="Starts" error={errors.triggerType?.message} required>
            {(field) => (
              <Controller
                control={control}
                name="triggerType"
                render={({ field: control_ }) => (
                  <Select value={control_.value} onValueChange={control_.onChange}>
                    <SelectTrigger {...field} className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIGGER_TYPES.map((trigger) => (
                        <SelectItem key={trigger.value} value={trigger.value}>
                          {trigger.label}
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
        title="Steps"
        description={
          fields.length > 0
            ? `Runs over ${totalDays} day${totalDays === 1 ? "" : "s"}, ${fields.length} step${fields.length === 1 ? "" : "s"}.`
            : undefined
        }
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                clientId: nextClientId(),
                name: "",
                channel: "CALL",
                offsetDays: offsets.at(-1) ?? 0,
                assigneeRole: "",
                templateId: "",
                actionMessage: "",
              })
            }
          >
            <Plus aria-hidden="true" />
            Add step
          </Button>
        }
      >
        {typeof errors.steps?.message === "string" ? (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{errors.steps.message}</AlertDescription>
          </Alert>
        ) : null}

        <DndContext
          id="sequence-builder"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={({ active }) => setActiveId(active.id)}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <SortableContext
            items={fields.map((field) => field.clientId)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-3">
              {fields.map((field, index) => (
                <SortableStepRow
                  key={field.clientId}
                  clientId={field.clientId}
                  index={index}
                  channel={channels[index]}
                  control={control}
                  register={register}
                  errors={errors}
                  dragging={activeId === field.clientId}
                  outOfOrder={
                    index > 0 &&
                    Number.isFinite(offsets[index]) &&
                    Number.isFinite(offsets[index - 1]) &&
                    offsets[index] < offsets[index - 1]
                  }
                  canRemove={fields.length > 1}
                  onRemove={() => remove(index)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </SectionCard>

      {serverError ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t save</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="sticky bottom-0 z-20 -mx-(--content-gutter) border-t bg-background/90 px-(--content-gutter) backdrop-blur">
        <div className="flex flex-wrap items-center justify-end gap-2 py-3">
          {isDirty ? (
            <p className="mr-auto text-caption text-muted-foreground">Unsaved changes</p>
          ) : null}
          <Button type="button" variant="ghost" asChild>
            <Link href={cancelHref}>Cancel</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={handleSubmit((values) => saveSequence(values, false))}
          >
            {isSubmitting ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
            Save draft
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit((values) => saveSequence(values, true))}
          >
            {isSubmitting ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
            Submit for approval
          </Button>
        </div>
      </div>
    </form>
  );
}

function SortableStepRow({ clientId, ...props }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: clientId,
  });

  return (
    <SequenceStepCard
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      dragging={isDragging}
      attributes={attributes}
      listeners={listeners}
      {...props}
    />
  );
}
