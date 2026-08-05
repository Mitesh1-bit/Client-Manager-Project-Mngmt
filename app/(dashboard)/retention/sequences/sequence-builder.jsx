"use client";

import { useState } from "react";
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
import { SectionCard } from "@/app/components/domain/states";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Switch } from "@/app/components/ui/switch";
import { Textarea } from "@/app/components/ui/textarea";
import {
  AddSequenceStepDocument,
  CreateRetentionSequenceDocument,
  RemoveSequenceStepDocument,
  UpdateRetentionSequenceDocument,
} from "@/app/lib/graphql/generated/documents";

import { SequenceStepCard } from "./sequence-step-card";
import {
  TRIGGER_TYPES,
  nextClientId,
  sequenceSchema,
  sequenceToFormValues,
  toSequenceInput,
} from "./sequence-schema";

/**
 * Create and edit share one builder. Interaction weight matches the Kanban
 * board from Phase 3 deliberately — this is the other place in the app where
 * someone reorders a list by feel and expects it to hold together: drag with
 * the mouse, reorder with the keyboard, and out-of-order steps flagged as you
 * go rather than only on submit.
 */
export function SequenceBuilder({ mode, sequence }) {
  const router = useRouter();
  const [serverError, setServerError] = useState(null);
  const [createSequence] = useMutation(CreateRetentionSequenceDocument);
  const [updateSequence] = useMutation(UpdateRetentionSequenceDocument);
  const [addStep] = useMutation(AddSequenceStepDocument);
  const [removeStep] = useMutation(RemoveSequenceStepDocument);

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

  async function onSubmit(values) {
    setServerError(null);
    const input = toSequenceInput(values);

    try {
      if (mode === "create") {
        const { data } = await createSequence({
          variables: {
            name: input.name,
            triggerType: input.triggerType?.toLowerCase() ?? "manual",
            isTemplate: input.isTemplate ?? false,
          },
          update: (cache) => cache.evict({ fieldName: "retentionSequences" }),
        });
        const sequenceId = data.createRetentionSequence.id;

        // Steps aren't part of createRetentionSequence — the API only lets
        // you append them one at a time, so they're added here in order
        // right after the sequence itself is created.
        for (const step of input.steps) {
          await addStep({
            variables: {
              sequenceId,
              channel: step.channel.toLowerCase(),
              offsetDays: Number(step.offsetDays),
              templateId: step.templateId || null,
              assigneeRole: step.assigneeRole ? step.assigneeRole.toLowerCase() : null,
            },
          });
        }

        toast.success(`"${data.createRetentionSequence.name}" created`);
        router.push(`/retention/sequences/${sequenceId}`);
      } else {
        await updateSequence({
          variables: {
            id: sequence.id,
            name: input.name,
            triggerType: input.triggerType?.toLowerCase() ?? null,
            isActive: input.isActive,
          },
        });

        // Steps that were on the sequence originally but aren't in the form
        // anymore were removed in the builder — delete them on the server.
        const remainingIds = new Set(input.steps.map((step) => step.id).filter(Boolean));
        const removedIds = (sequence.steps ?? [])
          .map((step) => step.id)
          .filter((id) => !remainingIds.has(id));
        for (const stepId of removedIds) {
          await removeStep({ variables: { stepId } });
        }

        // Steps with no server id are new — the API only supports appending,
        // not reordering or editing existing steps in place, so those are
        // left as-is (still shown, still real, just not touched here).
        const newSteps = input.steps.filter((step) => !step.id);
        for (const step of newSteps) {
          await addStep({
            variables: {
              sequenceId: sequence.id,
              channel: step.channel.toLowerCase(),
              offsetDays: Number(step.offsetDays),
              templateId: step.templateId || null,
              assigneeRole: step.assigneeRole ? step.assigneeRole.toLowerCase() : null,
            },
          });
        }

        toast.success(`"${input.name}" updated`);
        router.push(`/retention/sequences/${sequence.id}`);
      }
      router.refresh();
    } catch (error) {
      setServerError(error?.message ?? "We couldn't save this sequence. Try again.");
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <SectionCard title="About this sequence">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Name"
            error={errors.name?.message}
            required
            className="sm:col-span-2"
          >
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

          <FormField
            label="Description"
            error={errors.description?.message}
            className="sm:col-span-2"
          >
            {(field) => (
              <Textarea
                {...field}
                {...register("description")}
                rows={2}
                placeholder="What this sequence is for and when to use it."
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

          <div className="flex items-center justify-between gap-4 rounded-lg border p-3.5">
            <div className="min-w-0">
              <Label htmlFor="seq-active" className="text-caption font-medium">
                Active
              </Label>
              <p className="mt-0.5 text-[0.75rem] text-muted-foreground">
                Inactive sequences can&apos;t be enrolled into.
              </p>
            </div>
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Switch id="seq-active" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>
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
              "Create sequence"
            ) : (
              "Save changes"
            )}
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
