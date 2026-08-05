"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
import { PortalLoginDocument } from "@/app/lib/graphql/generated/documents";
import { formatGraphqlError } from "@/app/lib/graphql/format-error";

const schema = z.object({
  email: z.string().min(1, "Enter your email.").email("That doesn't look like an email."),
  password: z.string().min(1, "Enter your password."),
});

export function ClientLoginForm() {
  const searchParams = useSearchParams();
  const apollo = useApolloClient();
  const [submitError, setSubmitError] = useState(null);
  const [portalLogin] = useMutation(PortalLoginDocument);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values) {
    setSubmitError(null);
    try {
      const { data } = await portalLogin({
        variables: {
          email: values.email.trim().toLowerCase(),
          password: values.password,
        },
      });
      const token = data?.portalLogin?.accessToken;
      if (!token) throw new Error("We couldn't verify your credentials.");
      await establishSession(apollo, token, searchParams.get("next") ?? "/portal");
    } catch (error) {
      const message = formatGraphqlError(error, "Something went wrong. Try again.");
      const hint =
        message === "Invalid credentials"
          ? " Use the contact email exactly as saved under Clients → Contacts, with the portal password set there (not your staff login). If portal access was just enabled, open the contact, set a new portal password, and save again."
          : "";
      setSubmitError(message + hint);
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
          <AlertTitle>Couldn&apos;t sign you in</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}

      <FormField label="Email" error={errors.email?.message} required>
        {(field) => (
          <Input {...field} {...register("email")} type="email" autoComplete="username" className="h-10" />
        )}
      </FormField>

      <FormField label="Password" error={errors.password?.message} required>
        {(field) => (
          <PasswordInput
            {...field}
            {...register("password")}
            autoComplete="current-password"
            className="h-10"
          />
        )}
      </FormField>

      <Button type="submit" size="lg" className="h-10 w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <LoaderCircle aria-hidden="true" className="animate-spin" />
            Signing in…
          </>
        ) : (
          "Sign in to portal"
        )}
      </Button>

      <p className="text-center text-caption text-muted-foreground">
        Agency staff?{" "}
        <Link href="/login" className="font-medium text-mkt-cta hover:underline">
          Sign in here
        </Link>
      </p>
    </form>
  );
}
