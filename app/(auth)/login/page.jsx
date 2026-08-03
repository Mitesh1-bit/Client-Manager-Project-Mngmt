import Link from "next/link";
import { Suspense } from "react";

import { Skeleton } from "@/app/components/ui/skeleton";

import { AuthPageFooter, AuthPageHeader } from "../auth-shell";
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

      <AuthPageFooter>
        No account?{" "}
        <Link href="/signup" className="font-semibold text-mkt-navy hover:text-mkt-coral">
          Create workspace
        </Link>
        {" · "}
        <Link href="/client-login" className="font-semibold text-mkt-navy hover:text-mkt-coral">
          Client portal
        </Link>
      </AuthPageFooter>
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
