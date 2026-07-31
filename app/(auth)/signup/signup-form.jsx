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
import { establishSession } from "@/app/lib/auth/establish-session";
import { SignupDocument } from "@/app/lib/graphql/generated/documents";
import { formatGraphqlError } from "@/app/lib/graphql/format-error";

const schema = z
  .object({
    organizationName: z.string().min(2, "Tell us your agency or company name."),
    fullName: z.string().min(2, "Enter your full name."),
    email: z.string().min(1, "Enter your work email.").email("That doesn't look like an email."),
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
      className="space-y-5"
    >
      {submitError ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t create your workspace</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}

      <FormField label="Agency or company name" error={errors.organizationName?.message} required>
        {(field) => (
          <Input
            {...field}
            {...register("organizationName")}
            autoComplete="organization"
            placeholder="Meridian Studio"
            className="h-10"
          />
        )}
      </FormField>

      <FormField label="Your name" error={errors.fullName?.message} required>
        {(field) => (
          <Input {...field} {...register("fullName")} autoComplete="name" className="h-10" />
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
            className="h-10"
          />
        )}
      </FormField>

      <FormField
        label="Password"
        hint="At least 12 characters, with a number and a symbol."
        error={errors.password?.message}
        required
      >
        {(field) => (
          <Input
            {...field}
            {...register("password")}
            type="password"
            autoComplete="new-password"
            className="h-10"
          />
        )}
      </FormField>

      <FormField label="Confirm password" error={errors.confirmPassword?.message} required>
        {(field) => (
          <Input
            {...field}
            {...register("confirmPassword")}
            type="password"
            autoComplete="new-password"
            className="h-10"
          />
        )}
      </FormField>

      <Button type="submit" size="lg" className="h-10 w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <LoaderCircle aria-hidden="true" className="animate-spin" />
            Creating workspace…
          </>
        ) : (
          "Create workspace"
        )}
      </Button>
    </form>
  );
}
