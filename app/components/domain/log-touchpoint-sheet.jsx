"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLazyQuery } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { FormField } from "@/app/components/domain/form-field";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/app/components/ui/sheet";
import { Textarea } from "@/app/components/ui/textarea";
import { CHANNEL_OPTIONS } from "@/app/lib/channels";
import { CompanyTouchpointContextDocument } from "@/app/lib/graphql/generated/documents";

const NONE = "__none__";
const today = () => new Date().toISOString().slice(0, 10);

const touchpointSchema = z
  .object({
    companyId: z.string().min(1, "Choose a company."),
    contactId: z.string().optional().transform((value) => value || null),
    projectId: z.string().optional().transform((value) => value || null),
    type: z.enum(["EMAIL", "CALL", "MEETING", "INTERNAL_TASK"]),
    when: z.enum(["COMPLETED", "SCHEDULED"]),
    date: z.string().min(1, "Choose a date."),
    outcome: z.string().optional().transform((value) => value || null),
    notes: z.string().trim().max(1000, "Keep this under 1000 characters.").optional().transform((v) => v || null),
  })
  .refine((values) => values.when !== "COMPLETED" || Boolean(values.outcome), {
    path: ["outcome"],
    message: "How did it go?",
  });

/**
 * Logs a touchpoint against a company — either something that already
 * happened (outcome required) or something booked for later (no outcome
 * yet). If `companyId` isn't fixed, the first field is a company picker and
 * contacts/projects load once one is chosen.
 *
 * @param {{ trigger: React.ReactNode, companyId?: string, companyName?: string, companies?: Array<{ id: string, name: string }> }} props
 */
export function LogTouchpointSheet({ trigger, companyId, companyName, companies }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [loadContext, { data: contextData, loading: contextLoading }] = useLazyQuery(
    CompanyTouchpointContextDocument,
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(touchpointSchema),
    defaultValues: {
      companyId: companyId ?? "",
      contactId: "",
      projectId: "",
      type: "CALL",
      when: "COMPLETED",
      date: today(),
      outcome: "",
      notes: "",
    },
  });

  const selectedCompanyId = watch("companyId");
  const when = watch("when");

  useEffect(() => {
    if (selectedCompanyId) loadContext({ variables: { id: selectedCompanyId } });
  }, [selectedCompanyId, loadContext]);

  const contacts = contextData?.company?.contacts ?? [];
  const projects = contextData?.company?.projects ?? [];

  async function onSubmit(_values) {
    setServerError("Manual touchpoint logging is not exposed by the API yet. Use retention enrollments instead.");
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setServerError(null);
          reset();
        }
      }}
    >
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b pr-12">
          <SheetTitle>Log a touchpoint</SheetTitle>
          <SheetDescription>
            {companyName ? `For ${companyName}.` : "Record a call, email, meeting or task."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
            {serverError ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-caption text-destructive">
                {serverError}
              </p>
            ) : null}

            {companyId ? null : (
              <FormField label="Company" error={errors.companyId?.message} required>
                {(field) => (
                  <Controller
                    control={control}
                    name="companyId"
                    render={({ field: control_ }) => (
                      <Select value={control_.value} onValueChange={control_.onChange}>
                        <SelectTrigger {...field} className="h-10 w-full">
                          <SelectValue placeholder="Choose a company" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies?.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                )}
              </FormField>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Contact" hint={contextLoading ? "Loading…" : undefined}>
                {(field) => (
                  <Controller
                    control={control}
                    name="contactId"
                    render={({ field: control_ }) => (
                      <Select
                        value={control_.value || NONE}
                        onValueChange={(value) => control_.onChange(value === NONE ? "" : value)}
                        disabled={!selectedCompanyId}
                      >
                        <SelectTrigger {...field} className="h-10 w-full">
                          <SelectValue placeholder="Nobody specific" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>Nobody specific</SelectItem>
                          {contacts.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id}>
                              {contact.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                )}
              </FormField>

              <FormField label="Project">
                {(field) => (
                  <Controller
                    control={control}
                    name="projectId"
                    render={({ field: control_ }) => (
                      <Select
                        value={control_.value || NONE}
                        onValueChange={(value) => control_.onChange(value === NONE ? "" : value)}
                        disabled={!selectedCompanyId}
                      >
                        <SelectTrigger {...field} className="h-10 w-full">
                          <SelectValue placeholder="Not project-specific" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>Not project-specific</SelectItem>
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
            </div>

            <FormField label="Channel" required>
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
                        {CHANNEL_OPTIONS.map((option) => (
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

            <fieldset className="rounded-lg border p-1">
              <div className="grid grid-cols-2 gap-1" role="radiogroup" aria-label="When">
                <ModeButton
                  active={when === "COMPLETED"}
                  label="Already happened"
                  name="when"
                  value="COMPLETED"
                  control={control}
                />
                <ModeButton
                  active={when === "SCHEDULED"}
                  label="Book for later"
                  name="when"
                  value="SCHEDULED"
                  control={control}
                />
              </div>
            </fieldset>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label={when === "COMPLETED" ? "When it happened" : "Scheduled for"}
                error={errors.date?.message}
                required
              >
                {(field) => <Input {...field} {...register("date")} type="date" className="h-10" />}
              </FormField>

              {when === "COMPLETED" ? (
                <FormField label="Outcome" error={errors.outcome?.message} required>
                  {(field) => (
                    <Controller
                      control={control}
                      name="outcome"
                      render={({ field: control_ }) => (
                        <Select value={control_.value} onValueChange={control_.onChange}>
                          <SelectTrigger {...field} className="h-10 w-full">
                            <SelectValue placeholder="How did it go?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="POSITIVE">Positive</SelectItem>
                            <SelectItem value="NEUTRAL">Neutral</SelectItem>
                            <SelectItem value="AT_RISK">At risk</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  )}
                </FormField>
              ) : null}
            </div>

            <FormField label="Notes" error={errors.notes?.message}>
              {(field) => (
                <Textarea
                  {...field}
                  {...register("notes")}
                  rows={3}
                  placeholder="What was discussed, or what to cover when it happens."
                />
              )}
            </FormField>
          </div>

          <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
              {when === "COMPLETED" ? "Log touchpoint" : "Schedule touchpoint"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function ModeButton({ active, label, name, value, control }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <button
          type="button"
          role="radio"
          aria-checked={active}
          onClick={() => field.onChange(value)}
          className={
            active
              ? "rounded-md bg-primary px-3 py-2 text-caption font-medium text-primary-foreground"
              : "rounded-md px-3 py-2 text-caption font-medium text-muted-foreground hover:bg-accent"
          }
        >
          {label}
        </button>
      )}
    />
  );
}
