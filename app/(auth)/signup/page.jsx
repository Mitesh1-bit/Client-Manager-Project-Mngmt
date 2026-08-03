import Link from "next/link";
import { Suspense } from "react";

import { Skeleton } from "@/app/components/ui/skeleton";

import { AuthPageFooter, AuthPageHeader } from "../auth-shell";
import { SignupForm } from "./signup-form";

export const metadata = { title: "Create your workspace" };

export default function SignupPage() {
  return (
    <>
      <AuthPageHeader title="Create workspace" subtitle="Agency name, your details, and you're in." />

      <Suspense fallback={<FormSkeleton />}>
        <SignupForm />
      </Suspense>

      <AuthPageFooter>
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-mkt-navy hover:text-mkt-coral">
          Sign in
        </Link>
      </AuthPageFooter>
    </>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <Skeleton className="h-9 w-full" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-9" />
        <Skeleton className="h-9" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-9" />
        <Skeleton className="h-9" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
