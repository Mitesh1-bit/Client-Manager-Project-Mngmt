"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { LoaderCircle } from "lucide-react";
import { z } from "zod";

import { FormField } from "@/app/components/domain/form-field";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { PasswordInput } from "@/app/components/ui/password-input";
import { establishSession } from "@/app/lib/auth/establish-session";
import { SignupDocument } from "@/app/lib/graphql/generated/documents";
import { formatGraphqlError } from "@/app/lib/graphql/format-error";
import { workEmailField } from "@/app/lib/validation/email";

import { authInputClass } from "../auth-shell";

const schema = z
  .object({
    organizationName: z.string().min(2, "Tell us your agency or company name."),
    fullName: z.string().min(2, "Enter your full name."),
    email: workEmailField(),
    password: z
      .string()
      .min(12, "Use at least 12 characters.")
      .regex(/[0-9]/, "Include at least one number.")
      .regex(/[^A-Za-z0-9]/, "Include at least one symbol."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match.",
  });

export function SignupForm() {
  const searchParams = useSearchParams();
  const apollo = useApolloClient();
  const [submitError, setSubmitError] = useState(null);
  const [signup] = useMutation(SignupDocument);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      organizationName: "",
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values) {
    setSubmitError(null);
    try {
      const { data } = await signup({
        variables: {
          organizationName: values.organizationName,
          fullName: values.fullName,
          email: values.email,
          password: values.password,
        },
      });
      const payload = data?.signup;
      if (!payload?.accessToken) {
        throw new Error("We couldn't create your workspace. Try again.");
      }

      await establishSession(apollo, payload.accessToken, searchParams.get("next"));
    } catch (error) {
      setSubmitError(formatGraphqlError(error, "Something went wrong. Try again."));
    }
  }

  return (
    <form
      method="post"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit(onSubmit)(event);
      }}
      className="space-y-4"
    >
      {submitError ? (
        <Alert variant="destructive" className="py-2">
          <AlertTitle className="text-sm">Couldn&apos;t create workspace</AlertTitle>
          <AlertDescription className="text-xs">{submitError}</AlertDescription>
        </Alert>
      ) : null}

      <FormField label="Agency name" error={errors.organizationName?.message} required>
        {(field) => (
          <Input
            {...field}
            {...register("organizationName")}
            autoComplete="organization"
            placeholder="Meridian Studio"
            className={authInputClass(true)}
          />
        )}
      </FormField>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Your name" error={errors.fullName?.message} required>
          {(field) => (
            <Input {...field} {...register("fullName")} autoComplete="name" className={authInputClass(true)} />
          )}
        </FormField>

        <FormField label="Work email" error={errors.email?.message} required>
          {(field) => (
            <Input
              {...field}
              {...register("email")}
              type="email"
              autoComplete="username"
              placeholder="you@company.com"
              className={authInputClass(true)}
            />
          )}
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Password" error={errors.password?.message} required>
          {(field) => (
            <PasswordInput
              {...field}
              {...register("password")}
              autoComplete="new-password"
              placeholder="12+ chars"
              className={authInputClass(true)}
            />
          )}
        </FormField>

        <FormField label="Confirm" error={errors.confirmPassword?.message} required>
          {(field) => (
            <PasswordInput
              {...field}
              {...register("confirmPassword")}
              autoComplete="new-password"
              className={authInputClass(true)}
            />
          )}
        </FormField>
      </div>

      <Button
        type="submit"
        size="lg"
        className="h-11 w-full rounded-lg bg-mkt-navy font-semibold text-white hover:bg-mkt-navy/90"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <LoaderCircle aria-hidden="true" className="animate-spin" />
            Creating…
          </>
        ) : (
          "Create workspace"
        )}
      </Button>
    </form>
  );
}
