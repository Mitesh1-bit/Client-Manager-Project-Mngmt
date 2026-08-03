"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { FormField } from "@/app/components/domain/form-field";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { ChangeMyPasswordDocument, UpdateMyProfileDocument } from "@/app/lib/graphql/generated/documents";

const internalProfileSchema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters."),
  avatarUrl: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || null),
});

const portalProfileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  title: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || null),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z.string().min(12, "Use at least 12 characters."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match.",
  });

/**
 * @param {{
 *   scope: 'INTERNAL' | 'PORTAL';
 *   viewer: { name?: string; email?: string; avatarUrl?: string | null; contact?: { firstName?: string; lastName?: string; title?: string | null } | null };
 * }} props
 */
export function ProfileSettingsForm({ scope, viewer }) {
  const router = useRouter();
  const isPortal = scope === "PORTAL";
  const [profileError, setProfileError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [updateProfile, { loading: profileLoading }] = useMutation(UpdateMyProfileDocument);
  const [changePassword, { loading: passwordLoading }] = useMutation(ChangeMyPasswordDocument);

  const profileForm = useForm({
    resolver: zodResolver(isPortal ? portalProfileSchema : internalProfileSchema),
    defaultValues: isPortal
      ? {
          firstName: viewer.contact?.firstName ?? "",
          lastName: viewer.contact?.lastName ?? "",
          title: viewer.contact?.title ?? "",
        }
      : {
          name: viewer.name ?? "",
          avatarUrl: viewer.avatarUrl ?? "",
        },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  async function onSaveProfile(values) {
    setProfileError(null);
    try {
      await updateProfile({
        variables: isPortal
          ? {
              firstName: values.firstName,
              lastName: values.lastName,
              title: values.title,
            }
          : {
              name: values.name,
              avatarUrl: values.avatarUrl,
            },
      });
      toast.success("Profile updated");
      router.refresh();
    } catch (error) {
      setProfileError(error?.message ?? "We couldn't save your profile.");
    }
  }

  async function onSavePassword(values) {
    setPasswordError(null);
    try {
      await changePassword({
        variables: {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        },
      });
      toast.success("Password updated");
      passwordForm.reset();
      router.refresh();
    } catch (error) {
      setPasswordError(error?.message ?? "We couldn't update your password.");
    }
  }

  const profileErrors = profileForm.formState.errors;
  const passwordErrors = passwordForm.formState.errors;

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h2 className="text-title">Profile</h2>
          <p className="mt-1 text-caption text-muted-foreground">
            {isPortal
              ? "How you appear to your agency in the client portal."
              : "Your name and avatar across the dashboard."}
          </p>
        </div>

        <form noValidate onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
          {profileError ? (
            <Alert variant="destructive">
              <AlertTitle>Couldn&apos;t save profile</AlertTitle>
              <AlertDescription>{profileError}</AlertDescription>
            </Alert>
          ) : null}

          <FormField label="Email">
            {(field) => (
              <Input {...field} value={viewer.email ?? ""} disabled className="h-10 bg-muted/50" />
            )}
          </FormField>

          {isPortal ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="First name" error={profileErrors.firstName?.message} required>
                  {(field) => (
                    <Input {...field} {...profileForm.register("firstName")} className="h-10" />
                  )}
                </FormField>
                <FormField label="Last name" error={profileErrors.lastName?.message} required>
                  {(field) => (
                    <Input {...field} {...profileForm.register("lastName")} className="h-10" />
                  )}
                </FormField>
              </div>
              <FormField label="Job title" error={profileErrors.title?.message}>
                {(field) => <Input {...field} {...profileForm.register("title")} className="h-10" />}
              </FormField>
            </>
          ) : (
            <>
              <FormField label="Display name" error={profileErrors.name?.message} required>
                {(field) => <Input {...field} {...profileForm.register("name")} className="h-10" />}
              </FormField>
              <FormField label="Avatar URL" error={profileErrors.avatarUrl?.message}>
                {(field) => (
                  <Input
                    {...field}
                    {...profileForm.register("avatarUrl")}
                    type="url"
                    placeholder="https://…"
                    className="h-10"
                  />
                )}
              </FormField>
            </>
          )}

          <Button type="submit" disabled={profileLoading}>
            {profileLoading ? (
              <>
                <LoaderCircle aria-hidden="true" className="animate-spin" />
                Saving…
              </>
            ) : (
              "Save profile"
            )}
          </Button>
        </form>
      </section>

      <section className="space-y-4 border-t pt-8">
        <div>
          <h2 className="text-title">Password</h2>
          <p className="mt-1 text-caption text-muted-foreground">
            Choose a strong password of at least 12 characters.
          </p>
        </div>

        <form noValidate onSubmit={passwordForm.handleSubmit(onSavePassword)} className="space-y-4">
          {passwordError ? (
            <Alert variant="destructive">
              <AlertTitle>Couldn&apos;t update password</AlertTitle>
              <AlertDescription>{passwordError}</AlertDescription>
            </Alert>
          ) : null}

          <FormField label="Current password" error={passwordErrors.currentPassword?.message} required>
            {(field) => (
              <Input
                {...field}
                {...passwordForm.register("currentPassword")}
                type="password"
                autoComplete="current-password"
                className="h-10"
              />
            )}
          </FormField>
          <FormField label="New password" error={passwordErrors.newPassword?.message} required>
            {(field) => (
              <Input
                {...field}
                {...passwordForm.register("newPassword")}
                type="password"
                autoComplete="new-password"
                className="h-10"
              />
            )}
          </FormField>
          <FormField label="Confirm new password" error={passwordErrors.confirmPassword?.message} required>
            {(field) => (
              <Input
                {...field}
                {...passwordForm.register("confirmPassword")}
                type="password"
                autoComplete="new-password"
                className="h-10"
              />
            )}
          </FormField>

          <Button type="submit" disabled={passwordLoading}>
            {passwordLoading ? (
              <>
                <LoaderCircle aria-hidden="true" className="animate-spin" />
                Updating…
              </>
            ) : (
              "Update password"
            )}
          </Button>
        </form>
      </section>
    </div>
  );
}
