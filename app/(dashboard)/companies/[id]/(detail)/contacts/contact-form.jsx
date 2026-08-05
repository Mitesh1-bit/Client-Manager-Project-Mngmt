"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { FormField } from "@/app/components/domain/form-field";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { PasswordInput } from "@/app/components/ui/password-input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Switch } from "@/app/components/ui/switch";
import {
  CreateContactDocument,
  UpdateContactDocument,
} from "@/app/lib/graphql/generated/documents";

import { TIMEZONES } from "../../../company-schema";
import {
  contactEditFormSchema,
  contactFormSchema,
  contactToFormValues,
  PREFERRED_CHANNELS,
  toCreateContactVariables,
  toUpdateContactVariables,
  contactFullName,
} from "./contact-schema";

export function ContactForm({ companyId, contact, onDone, onCancel }) {
  const router = useRouter();
  const mode = contact ? "edit" : "create";
  const [serverError, setServerError] = useState(null);

  const [createContact] = useMutation(CreateContactDocument);
  const [updateContact] = useMutation(UpdateContactDocument);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(mode === "create" ? contactFormSchema : contactEditFormSchema),
    defaultValues: contactToFormValues(contact),
  });

  const portalEnabled = useWatch({ control, name: "portalAccessEnabled" });

  async function onSubmit(values) {
    setServerError(null);

    try {
      if (mode === "create") {
        const { data } = await createContact({
          variables: toCreateContactVariables(values, companyId),
          update: (cache) => cache.evict({ id: cache.identify({ __typename: "CompanyType", id: companyId }) }),
        });
        toast.success(`${contactFullName(data.createContact)} added`);
      } else {
        const { data } = await updateContact({
          variables: toUpdateContactVariables(contact.id, values),
        });
        toast.success(`${contactFullName(data.updateContact)} updated`);
      }
      router.refresh();
      onDone?.();
    } catch (error) {
      setServerError(error?.message ?? "We couldn't save this contact. Try again.");
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div className="min-h-0 flex-1 space-y-5 overflow-x-hidden overflow-y-auto overscroll-contain px-5 py-4 pb-6">
        {serverError ? (
          <Alert variant="destructive">
            <AlertTitle>Couldn&apos;t save</AlertTitle>
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="First name" error={errors.firstName?.message} required>
            {(field) => <Input {...field} {...register("firstName")} className="h-10" autoFocus />}
          </FormField>
          <FormField label="Last name" error={errors.lastName?.message} required>
            {(field) => <Input {...field} {...register("lastName")} className="h-10" />}
          </FormField>
        </div>

        <FormField label="Email" error={errors.email?.message} required>
          {(field) => (
            <Input {...field} {...register("email")} type="email" className="h-10" />
          )}
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Phone" error={errors.phone?.message}>
            {(field) => <Input {...field} {...register("phone")} type="tel" className="h-10" />}
          </FormField>
          <FormField label="Job title" error={errors.title?.message}>
            {(field) => <Input {...field} {...register("title")} className="h-10" />}
          </FormField>
          <FormField label="Department" error={errors.department?.message}>
            {(field) => <Input {...field} {...register("department")} className="h-10" />}
          </FormField>
          <FormField label="LinkedIn" error={errors.linkedinUrl?.message}>
            {(field) => <Input {...field} {...register("linkedinUrl")} className="h-10" />}
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Preferred channel" error={errors.preferredChannel?.message}>
            {(field) => (
              <Controller
                control={control}
                name="preferredChannel"
                render={({ field: control_ }) => (
                  <Select value={control_.value} onValueChange={control_.onChange}>
                    <SelectTrigger {...field} className="h-10 w-full">
                      <SelectValue placeholder="Not set" />
                    </SelectTrigger>
                    <SelectContent>
                      {PREFERRED_CHANNELS.map((channel) => (
                        <SelectItem key={channel.value} value={channel.value}>
                          {channel.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
          </FormField>

          <FormField label="Timezone" error={errors.timezone?.message}>
            {(field) => (
              <Controller
                control={control}
                name="timezone"
                render={({ field: control_ }) => (
                  <Select value={control_.value} onValueChange={control_.onChange}>
                    <SelectTrigger {...field} className="h-10 w-full">
                      <SelectValue placeholder="Not set" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((zone) => (
                        <SelectItem key={zone} value={zone}>
                          {zone.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
          </FormField>
        </div>

        <FormField
          label="Best time to contact"
          hint="Free text — whatever they told you."
          error={errors.bestTimeToContact?.message}
        >
          {(field) => (
            <Input
              {...field}
              {...register("bestTimeToContact")}
              className="h-10"
              placeholder="Mornings, before 11am ET"
            />
          )}
        </FormField>

        <fieldset className="space-y-3 rounded-lg border p-4">
          <legend className="px-1 text-caption font-medium">Permissions and preferences</legend>

          <ToggleRow
            control={control}
            name="isPrimary"
            label="Primary contact"
            description="The main spokesperson. Only one per client — setting this unsets the current one."
            error={errors.isPrimary?.message}
          />
          <ToggleRow
            control={control}
            name="portalAccessEnabled"
            label="Client portal access"
            description="Lets them sign in at /client-login to see project status and raise change requests."
            error={errors.portalAccessEnabled?.message}
          />
          {portalEnabled ? (
            <FormField
              label="Portal password"
              hint="Share this with the client so they can sign in. Minimum 12 characters."
              error={errors.portalPassword?.message}
              required={mode === "create"}
            >
              {(field) => (
                <PasswordInput
                  {...field}
                  {...register("portalPassword")}
                  className="h-10"
                  autoComplete="new-password"
                  placeholder={mode === "edit" ? "Leave blank to keep current password" : ""}
                />
              )}
            </FormField>
          ) : null}
          <ToggleRow
            control={control}
            name="doNotContact"
            label="Do not contact"
            description="Excluded from automated retention sequences."
            error={errors.doNotContact?.message}
          />
        </fieldset>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 border-t bg-popover px-5 py-3">
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
            "Add contact"
          ) : (
            "Save changes"
          )}
        </Button>
      </div>
    </form>
  );
}

function ToggleRow({ control, name, label, description, error }) {
  const id = `toggle-${name}`;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-caption font-medium">
          {label}
        </Label>
        <p className="mt-0.5 text-[0.75rem] text-pretty text-muted-foreground">{description}</p>
        {error ? (
          <p id={errorId} className="mt-1 text-[0.75rem] text-destructive">
            {error}
          </p>
        ) : null}
      </div>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Switch
            id={id}
            checked={field.value}
            onCheckedChange={field.onChange}
            aria-describedby={errorId}
            aria-invalid={Boolean(error)}
          />
        )}
      />
    </div>
  );
}
