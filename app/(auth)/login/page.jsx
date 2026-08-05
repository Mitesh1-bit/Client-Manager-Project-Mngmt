import { Suspense } from "react";

import { Skeleton } from "@/app/components/ui/skeleton";

import { AuthAlternateActions, AuthPageHeader } from "../auth-shell";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <>
      <AuthPageHeader
        title="Sign in"
        subtitle="Work email for staff · portal password for client contacts."
      />

      <Suspense fallback={<FormSkeleton />}>
        <LoginForm />
      </Suspense>

      <AuthAlternateActions
        label="No account?"
        actions={[
          {
            href: "/signup",
            label: "Create workspace",
            description: "Set up Meridian for your agency team",
            icon: "building",
            tone: "primary",
          },
          {
            href: "/client-login",
            label: "Client portal",
            description: "Sign in as a client contact",
            icon: "users",
            tone: "portal",
          },
        ]}
      />
    </>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
