"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Info } from "lucide-react";
import { z } from "zod";

import { FormField } from "@/app/components/domain/form-field";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

import { authInputClass } from "../auth-shell";

const schema = z.object({
  workspace: z
    .string()
    .min(2, "Enter your workspace domain.")
    .regex(/^[a-z0-9.-]+$/i, "Use letters, numbers, dots and dashes only."),
});

export function SsoForm() {
  const [pending, setPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { workspace: "" } });

  return (
    <form noValidate onSubmit={handleSubmit(() => setPending(true))} className="space-y-3.5">
      {pending ? (
        <Alert className="py-2">
          <Info className="size-4" />
          <AlertTitle className="text-sm">Waiting on identity provider</AlertTitle>
          <AlertDescription className="text-xs">
            SSO redirects are issued by the backend WorkOS integration.
          </AlertDescription>
        </Alert>
      ) : null}

      <FormField
        label="Workspace domain"
        hint="The email domain your organisation signs in with."
        error={errors.workspace?.message}
        required
      >
        {(field) => (
          <Input
            {...field}
            {...register("workspace")}
            placeholder="acme.com"
            autoComplete="organization"
            className={authInputClass()}
          />
        )}
      </FormField>

      <Button type="submit" size="lg" className="h-11 w-full rounded-lg bg-mkt-navy font-semibold text-white hover:bg-mkt-navy/90">
        Continue with SSO
      </Button>
    </form>
  );
}
