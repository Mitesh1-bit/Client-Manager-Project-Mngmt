"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CircleCheck } from "lucide-react";
import { z } from "zod";

import { FormField } from "@/app/components/domain/form-field";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

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
  const [submitted, setSubmitted] = useState(false);

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

  if (submitted) {
    return (
      <Alert>
        <CircleCheck />
        <AlertTitle>Check your inbox</AlertTitle>
        <AlertDescription>
          Signup isn&apos;t wired to the API yet. Once the backend exposes an organisation signup
          mutation, this form will create your workspace and send a verification email.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit(() => setSubmitted(true))} className="space-y-5">
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
        Create workspace
      </Button>
    </form>
  );
}
