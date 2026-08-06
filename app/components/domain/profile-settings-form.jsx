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
import { PasswordInput } from "@/app/components/ui/password-input";
import {
  ChangeMyPasswordDocument,
  ConfirmTotpDocument,
  DisableTotpDocument,
  EnableTotpDocument,
  UpdateMyProfileDocument,
} from "@/app/lib/graphql/generated/documents";

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
              <PasswordInput
                {...field}
                {...passwordForm.register("currentPassword")}
                autoComplete="current-password"
                className="h-10"
              />
            )}
          </FormField>
          <FormField label="New password" error={passwordErrors.newPassword?.message} required>
            {(field) => (
              <PasswordInput
                {...field}
                {...passwordForm.register("newPassword")}
                autoComplete="new-password"
                className="h-10"
              />
            )}
          </FormField>
          <FormField label="Confirm new password" error={passwordErrors.confirmPassword?.message} required>
            {(field) => (
              <PasswordInput
                {...field}
                {...passwordForm.register("confirmPassword")}
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

      {isPortal ? null : <TwoFactorSection totpEnabled={Boolean(viewer.totpEnabled)} />}
    </div>
  );
}

/** @param {{ totpEnabled: boolean }} props */
function TwoFactorSection({ totpEnabled }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(totpEnabled);
  const [setup, setSetup] = useState(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [enableTotp, { loading: starting }] = useMutation(EnableTotpDocument);
  const [confirmTotp, { loading: confirming }] = useMutation(ConfirmTotpDocument);
  const [disableTotp, { loading: disabling }] = useMutation(DisableTotpDocument);

  async function handleStart() {
    setError(null);
    try {
      const { data } = await enableTotp();
      setSetup(data.enableTotp);
    } catch (mutationError) {
      setError(mutationError?.message ?? "Couldn't start setup. Try again.");
    }
  }

  function handleCancel() {
    setSetup(null);
    setCode("");
    setError(null);
  }

  async function handleConfirm(event) {
    event.preventDefault();
    setError(null);
    try {
      await confirmTotp({ variables: { code } });
      toast.success("Two-factor authentication enabled");
      setEnabled(true);
      setSetup(null);
      setCode("");
      router.refresh();
    } catch (mutationError) {
      setError(mutationError?.message ?? "That code didn't work. Try again.");
    }
  }

  async function handleDisable() {
    try {
      await disableTotp();
      toast.success("Two-factor authentication turned off");
      setEnabled(false);
      router.refresh();
    } catch (mutationError) {
      toast.error("Couldn't turn off two-factor authentication", {
        description: mutationError?.message,
      });
    }
  }

  return (
    <section className="space-y-4 border-t pt-8">
      <div>
        <h2 className="text-title">Two-factor authentication</h2>
        <p className="mt-1 text-caption text-muted-foreground">
          Require a code from an authenticator app when you sign in.
        </p>
      </div>

      {enabled ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3">
          <p className="text-caption font-medium text-tone-positive-fg">
            Enabled on your account
          </p>
          <Button variant="outline" size="sm" onClick={handleDisable} disabled={disabling}>
            {disabling ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
            Turn off
          </Button>
        </div>
      ) : setup ? (
        <form noValidate onSubmit={handleConfirm} className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Couldn&apos;t confirm</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-1.5">
            <p className="text-caption text-muted-foreground">
              Add this key to your authenticator app (Google Authenticator, 1Password, Authy…),
              then enter the 6-digit code it generates.
            </p>
            <code className="block truncate rounded-md bg-muted px-3 py-2 text-caption">
              {setup.secret}
            </code>
          </div>

          <FormField label="6-digit code" required>
            {(field) => (
              <Input
                {...field}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                className="h-10 w-32 tabular"
              />
            )}
          </FormField>

          <div className="flex gap-2">
            <Button type="submit" disabled={confirming || code.length !== 6}>
              {confirming ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
              Confirm and enable
            </Button>
            <Button type="button" variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button onClick={handleStart} disabled={starting}>
          {starting ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
          Set up two-factor authentication
        </Button>
      )}
    </section>
  );
}
