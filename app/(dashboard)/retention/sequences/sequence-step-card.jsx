"use client";

import { forwardRef } from "react";
import { Controller } from "react-hook-form";
import { GripVertical, TriangleAlert, Trash2 } from "lucide-react";

import { FormField } from "@/app/components/domain/form-field";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Button } from "@/app/components/ui/button";
import { SEQUENCE_CHANNEL_OPTIONS, channelIcon } from "@/app/lib/channels";
import { cn } from "@/app/lib/utils";

import { ASSIGNEE_ROLES } from "./sequence-schema";

/**
 * One step in the builder. Takes a ref and spreads drag listeners so it can be
 * wrapped by `useSortable` without knowing anything about dnd-kit itself —
 * same split used for the Kanban card in Phase 3.
 */
export const SequenceStepCard = forwardRef(function SequenceStepCard(
  {
    index,
    channel,
    control,
    register,
    errors,
    onRemove,
    canRemove,
    outOfOrder,
    dragging,
    style,
    listeners,
    attributes,
  },
  ref,
) {
  const ChannelIcon = channelIcon(channel);
  const showTemplate = false;
  const stepErrors = errors?.steps?.[index];

  return (
    <li
      ref={ref}
      style={style}
      className={cn(
        "rounded-xl border bg-card p-4 shadow-xs transition-shadow",
        dragging && "opacity-50 shadow-raised",
        outOfOrder && "border-tone-caution-border",
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-1 flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground focus-ring active:cursor-grabbing"
          aria-label={`Reorder step ${index + 1}`}
        >
          <GripVertical aria-hidden="true" className="size-4" />
        </button>

        <span
          aria-hidden="true"
          className="mt-1.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[0.6875rem] font-medium"
        >
          {index + 1}
        </span>

        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-12">
          <FormField
            label="Step name"
            error={stepErrors?.name?.message}
            className="sm:col-span-5"
          >
            {(field) => (
              <Input
                {...field}
                {...register(`steps.${index}.name`)}
                className="h-9"
                placeholder="Kickoff call"
              />
            )}
          </FormField>

          <FormField label="Channel" className="sm:col-span-3">
            {(field) => (
              <Controller
                control={control}
                name={`steps.${index}.channel`}
                render={({ field: control_ }) => (
                  <Select value={control_.value} onValueChange={control_.onChange}>
                    <SelectTrigger {...field} className="h-9 w-full">
                      <ChannelIcon aria-hidden="true" className="size-3.5 shrink-0 opacity-70" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SEQUENCE_CHANNEL_OPTIONS.map((option) => (
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

          <FormField
            label="Fires on day"
            hint={outOfOrder ? undefined : "After enrollment"}
            error={stepErrors?.offsetDays?.message}
            className="sm:col-span-2"
          >
            {(field) => (
              <Input
                {...field}
                {...register(`steps.${index}.offsetDays`)}
                type="number"
                min="0"
                step="1"
                className="h-9"
              />
            )}
          </FormField>

          <FormField label="Role" className="sm:col-span-2">
            {(field) => (
              <Controller
                control={control}
                name={`steps.${index}.assigneeRole`}
                render={({ field: control_ }) => (
                  <Select
                    value={control_.value || "__unassigned__"}
                    onValueChange={(value) =>
                      control_.onChange(value === "__unassigned__" ? "" : value)
                    }
                  >
                    <SelectTrigger {...field} className="h-9 w-full">
                      <SelectValue placeholder="Anyone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__unassigned__">Anyone</SelectItem>
                      {ASSIGNEE_ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
          </FormField>

          {showTemplate ? (
            <FormField
              label="Email template ID"
              hint="Optional — if your template system uses one."
              className="sm:col-span-12"
            >
              {(field) => (
                <Input
                  {...field}
                  {...register(`steps.${index}.templateId`)}
                  className="h-9"
                  placeholder="tpl_welcome"
                />
              )}
            </FormField>
          ) : null}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="mt-0.5 shrink-0"
          disabled={!canRemove}
          onClick={onRemove}
        >
          <Trash2 aria-hidden="true" />
          <span className="sr-only">Remove step {index + 1}</span>
        </Button>
      </div>

      {outOfOrder ? (
        <p className="mt-2.5 ml-11 flex items-center gap-1.5 text-[0.75rem] text-tone-caution-fg">
          <TriangleAlert aria-hidden="true" className="size-3.5 shrink-0" />
          This fires before the step ahead of it — drag it earlier or adjust the day.
        </p>
      ) : null}
    </li>
  );
});
