import { Suspense } from "react";

import { Skeleton } from "@/app/components/ui/skeleton";

import { AuthAlternateActions, AuthPageHeader } from "../auth-shell";
import { SignupForm } from "./signup-form";

export const metadata = { title: "Create your workspace" };

export default function SignupPage() {
  return (
    <>
      <AuthPageHeader title="Create workspace" subtitle="Agency name, your details, and you're in." />

      <Suspense fallback={<FormSkeleton />}>
        <SignupForm />
      </Suspense>

      <AuthAlternateActions
        label="Already have an account?"
        actions={[
          {
            href: "/login",
            label: "Sign in",
            description: "Return to your workspace",
            icon: "login",
            tone: "primary",
          },
        ]}
      />
    </>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <Skeleton className="h-9 w-full" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Skeleton className="h-9" />
        <Skeleton className="h-9" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Skeleton className="h-9" />
        <Skeleton className="h-9" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
