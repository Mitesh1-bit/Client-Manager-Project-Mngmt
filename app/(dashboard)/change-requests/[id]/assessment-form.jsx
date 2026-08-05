"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { FormField } from "@/app/components/domain/form-field";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { Textarea } from "@/app/components/ui/textarea";
import { isAssessed } from "@/app/lib/change-requests";
import { formatCurrency } from "@/app/lib/format";
import { AssessChangeRequestDocument } from "@/app/lib/graphql/generated/documents";

const numberField = (message) =>
  z
    .union([z.string(), z.number()])
    .optional()
    .transform((value) => {
      if (value === "" || value === null || value === undefined) return null;
      return Number(value);
    })
    .refine((value) => value === null || Number.isFinite(value), { message });

export const assessmentSchema = z.object({
  // Negative values are legitimate: a scope reduction gives time and money back.
  impactHours: numberField("Enter a number of hours."),
  impactCost: numberField("Enter an amount."),
  impactTimelineDays: numberField("Enter a number of days."),
  assessmentNotes: z
    .string()
    .trim()
    .min(10, "Explain the impact — this is what the client reads before deciding.")
    .max(2000, "Keep this under 2000 characters."),
  requiresInternalApproval: z.boolean().default(false),
  requiresClientApproval: z.boolean().default(true),
});

export function assessmentToFormValues(request, threshold) {
  return {
    impactHours: request?.impactHours ?? "",
    impactCost: request?.impactCost ?? "",
    impactTimelineDays: request?.impactTimelineDays ?? "",
    assessmentNotes: request?.assessmentNotes ?? "",
    requiresInternalApproval:
      request?.requiresInternalApproval ??
      Math.abs(Number(request?.impactCost ?? 0)) >= (threshold ?? 0),
    requiresClientApproval: request?.requiresClientApproval ?? true,
  };
}

/**
 * The PM-facing impact assessment. Submitting it is what moves a request into
 * approval and creates the approval rows to route against, so the form is
 * explicit about who will be asked next.
 */
export function AssessmentForm({ request, threshold, onDone }) {
  const router = useRouter();
  const [serverError, setServerError] = useState(null);
  const [assess] = useMutation(AssessChangeRequestDocument);

  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(assessmentSchema),
    defaultValues: assessmentToFormValues(request, threshold),
  });

  const cost = Number(watch("impactCost") || 0);
  const requiresInternal = watch("requiresInternalApproval");
  const requiresClient = watch("requiresClientApproval");

  // The internal-approval toggle suggests itself from the cost the PM is
  // typing, not just the cost the request already had when the form opened —
  // otherwise the hint text ("suggested at £8,000") and the toggle disagree
  // the moment someone fills in a fresh assessment. Stops suggesting the
  // moment the PM touches the toggle themselves, and never overrides a
  // decision that was already saved.
  const internalTouchedRef = useRef(isAssessed(request));
  useEffect(() => {
    if (internalTouchedRef.current) return;
    setValue("requiresInternalApproval", Math.abs(cost) >= (threshold ?? 0));
  }, [cost, threshold, setValue]);

  async function onSubmit(input) {
    setServerError(null);
    try {
      await assess({
        variables: {
          id: request.id,
          impactHours: input.impactHours,
          impactCost: input.impactCost,
          impactTimelineDays: input.impactTimelineDays,
          assessmentNotes: input.assessmentNotes,
        },
      });
      toast.success("Assessment recorded", {
        description:
          requiresInternal || requiresClient
            ? "The request has moved into approval."
            : "Nothing needed approval, so it's approved.",
      });
      router.refresh();
      onDone?.();
    } catch (error) {
      setServerError(error?.message ?? "We couldn't save the assessment. Try again.");
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {serverError ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t save</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField
          label="Effort"
          hint="Hours, negative to give time back."
          error={errors.impactHours?.message}
        >
          {(field) => (
            <Input {...field} {...register("impactHours")} type="number" step="0.5" className="h-10" />
          )}
        </FormField>

        <FormField label="Cost impact" hint="In pounds." error={errors.impactCost?.message}>
          {(field) => (
            <Input {...field} {...register("impactCost")} type="number" step="50" className="h-10" />
          )}
        </FormField>

        <FormField
          label="Timeline impact"
          hint="Days added to the plan."
          error={errors.impactTimelineDays?.message}
        >
          {(field) => (
            <Input
              {...field}
              {...register("impactTimelineDays")}
              type="number"
              step="1"
              className="h-10"
            />
          )}
        </FormField>
      </div>

      <FormField
        label="What this involves"
        hint="The client reads this before deciding. Be specific about what changes."
        error={errors.assessmentNotes?.message}
        required
      >
        {(field) => <Textarea {...field} {...register("assessmentNotes")} rows={4} />}
      </FormField>

      <fieldset className="space-y-3 rounded-lg border p-4">
        <legend className="px-1 text-caption font-medium">Who needs to approve this</legend>

        <ToggleRow
          control={control}
          name="requiresInternalApproval"
          label="Internal sign-off"
          description={
            threshold
              ? `Suggested for anything at or above ${formatCurrency(threshold)}. This one is ${formatCurrency(Math.abs(cost))}.`
              : "Someone on our side signs off before the client sees it."
          }
          onManualChange={() => {
            internalTouchedRef.current = true;
          }}
        />
        <ToggleRow
          control={control}
          name="requiresClientApproval"
          label="Client approval"
          description="The client approves in their portal before we start."
        />

        {!requiresInternal && !requiresClient ? (
          <p className="rounded-md bg-tone-caution-bg px-3 py-2 text-[0.75rem] text-tone-caution-fg">
            With neither selected this is approved immediately — use that for defects absorbed
            under the agreed scope.
          </p>
        ) : (
          <p className="text-[0.75rem] text-muted-foreground">
            {requiresInternal && requiresClient
              ? "Internal sign-off first, then the client."
              : requiresInternal
                ? "Goes to internal sign-off only."
                : "Goes straight to the client."}
          </p>
        )}
      </fieldset>

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
          {request.revisionCount > 0 ? "Update assessment" : "Send for approval"}
        </Button>
        {onDone ? (
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function ToggleRow({ control, name, label, description, onManualChange }) {
  const id = `assess-${name}`;
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-caption font-medium">
          {label}
        </Label>
        <p className="mt-0.5 text-[0.75rem] text-pretty text-muted-foreground">{description}</p>
      </div>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Switch
            id={id}
            checked={field.value}
            onCheckedChange={(value) => {
              onManualChange?.();
              field.onChange(value);
            }}
          />
        )}
      />
    </div>
  );
}
