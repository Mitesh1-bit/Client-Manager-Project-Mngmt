"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { safeNextPath } from "@/app/lib/auth/routes";
import { GRAPHQL_URL } from "@/app/lib/graphql/endpoint";
import { LoginDocument } from "@/app/lib/graphql/generated/documents";
import { DEMO_PASSWORD, demoAccounts } from "@/app/lib/mocks/demo-accounts";

const USING_MOCK_BACKEND = GRAPHQL_URL === "/api/graphql";

const schema = z.object({
  email: z.string().min(1, "Enter your work email.").email("That doesn't look like an email."),
  password: z.string().min(1, "Enter your password."),
});

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const apollo = useApolloClient();
  const [submitError, setSubmitError] = useState(null);
  const [login] = useMutation(LoginDocument);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values) {
    setSubmitError(null);
    try {
      const { data } = await login({ variables: values });
      const payload = data.login;

      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accessToken: payload.accessToken }),
      });
      if (!response.ok) throw new Error("We couldn't start your session. Try again.");

      await apollo.clearStore();
      router.replace(safeNextPath(searchParams.get("next"), payload.scope));
      router.refresh();
    } catch (error) {
      setSubmitError(error?.message ?? "Something went wrong. Try again.");
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {submitError ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t sign you in</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}

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

      <FormField label="Password" error={errors.password?.message} required>
        {(field) => (
          <Input
            {...field}
            {...register("password")}
            type="password"
            autoComplete="current-password"
            className="h-10"
          />
        )}
      </FormField>

      <div className="flex items-center justify-between">
        <Link href="/sso" className="text-caption text-primary hover:underline">
          Use single sign-on
        </Link>
        <Link href="/sso" className="text-caption text-muted-foreground hover:underline">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" size="lg" className="h-10 w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <LoaderCircle aria-hidden="true" className="animate-spin" />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </Button>

      {USING_MOCK_BACKEND ? (
        <DemoAccountPicker
          onPick={(email) => {
            setValue("email", email, { shouldValidate: true });
            setValue("password", DEMO_PASSWORD, { shouldValidate: true });
          }}
        />
      ) : null}
    </form>
  );
}

function DemoAccountPicker({ onPick }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/40 p-3">
      <p className="text-overline uppercase text-muted-foreground">Demo accounts</p>
      <p className="mt-1 text-caption text-muted-foreground">
        Running against local fixtures — password is{" "}
        <code className="rounded bg-background px-1 py-0.5 font-mono text-[0.75rem]">
          {DEMO_PASSWORD}
        </code>
        .
      </p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {demoAccounts.map((account) => (
          <Button
            key={account.email}
            type="button"
            variant="outline"
            size="xs"
            onClick={() => onPick(account.email)}
          >
            {account.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
