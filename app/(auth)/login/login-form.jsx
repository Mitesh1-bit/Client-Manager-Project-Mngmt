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
import { establishSession } from "@/app/lib/auth/establish-session";
import { PORTAL_HOME } from "@/app/lib/auth/routes";
import { isMockGraphqlEndpoint } from "@/app/lib/graphql/endpoint";
import { LoginDocument, PortalLoginDocument } from "@/app/lib/graphql/generated/documents";
import { formatGraphqlError } from "@/app/lib/graphql/format-error";
import { DEMO_PASSWORD, demoAccounts } from "@/app/lib/mocks/demo-accounts";

const USING_MOCK_BACKEND = isMockGraphqlEndpoint;

const schema = z.object({
  email: z.string().min(1, "Enter your work email.").email("That doesn't look like an email."),
  password: z.string().min(1, "Enter your password."),
});

export function LoginForm() {
  const searchParams = useSearchParams();
  const apollo = useApolloClient();
  const [submitError, setSubmitError] = useState(null);
  const [login] = useMutation(LoginDocument);
  const [portalLogin] = useMutation(PortalLoginDocument);

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
    const credentials = {
      email: values.email.trim().toLowerCase(),
      password: values.password,
    };

    try {
      const { data } = await login({ variables: credentials });
      const payload = data?.login;
      if (!payload) throw new Error("Unexpected response from the server.");

      if (payload.requires2fa) {
        throw new Error("Two-factor authentication is required for this account. Use the API TOTP flow.");
      }
      if (!payload.accessToken) {
        throw new Error("We couldn't verify your credentials. Check your email and password.");
      }

      await establishSession(apollo, payload.accessToken, searchParams.get("next"));
    } catch (error) {
      const message = formatGraphqlError(error, "");
      if (message !== "Invalid credentials") {
        setSubmitError(message || "Something went wrong. Try again.");
        return;
      }

      // Staff login failed — try client portal credentials on the same form.
      try {
        const { data } = await portalLogin({ variables: credentials });
        const token = data?.portalLogin?.accessToken;
        if (!token) {
          throw new Error("Invalid credentials");
        }
        const next = searchParams.get("next") ?? PORTAL_HOME;
        await establishSession(apollo, token, next);
      } catch (portalError) {
        setSubmitError(
          formatGraphqlError(portalError, "Invalid credentials") +
            " Check your email and password. Client contacts must use the portal password set under Companies → Contacts (not a staff password).",
        );
      }
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
        <Link href="/sso" className="text-caption font-medium text-mkt-cta hover:underline">
          Use single sign-on
        </Link>
        <Link href="/sso" className="text-caption text-mkt-navy/60 hover:underline">
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

      <p className="text-center text-caption text-mkt-navy/70">
        Client contact?{" "}
        <Link href="/client-login" className="font-medium text-mkt-cta hover:underline">
          Client portal sign in
        </Link>
      </p>

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
