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

import { authInputClass } from "../auth-shell";

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
            " Client contacts need the portal password from Companies → Contacts.",
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
      className="space-y-4"
    >
      {submitError ? (
        <Alert variant="destructive" className="py-2">
          <AlertTitle className="text-sm">Couldn&apos;t sign you in</AlertTitle>
          <AlertDescription className="text-xs">{submitError}</AlertDescription>
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
            className={authInputClass()}
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
            className={authInputClass()}
          />
        )}
      </FormField>

      <div className="flex items-center justify-between gap-2 pt-1 text-[0.78rem]">
        <Link href="/sso" className="font-medium text-mkt-navy/70 hover:text-mkt-navy">
          SSO
        </Link>
        <Link href="/sso" className="text-mkt-navy/45 hover:text-mkt-navy/70">
          Forgot password?
        </Link>
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
    <div className="border-t border-mkt-navy/8 pt-3">
      <p className="text-[0.65rem] uppercase tracking-wide text-mkt-navy/40">Demo · password {DEMO_PASSWORD}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {demoAccounts.map((account) => (
          <button
            key={account.email}
            type="button"
            onClick={() => onPick(account.email)}
            className="rounded border border-mkt-navy/12 px-2 py-0.5 text-[0.68rem] font-medium text-mkt-navy/70 transition hover:border-mkt-navy/25 hover:text-mkt-navy"
          >
            {account.label}
          </button>
        ))}
      </div>
    </div>
  );
}
