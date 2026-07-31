import { Suspense } from "react";
import Link from "next/link";

import { Skeleton } from "@/app/components/ui/skeleton";

import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-title">Sign in</h1>
      <p className="mt-2 text-caption text-muted-foreground">
        Internal team and client contacts sign in here — we&apos;ll take you to the right place.
      </p>

      <div className="mt-8">
        <Suspense fallback={<FormSkeleton />}>
          <LoginForm />
        </Suspense>
      </div>

      <p className="mt-8 text-caption text-muted-foreground">
        Need an account for your agency?{" "}
        <Link href="/signup" className="text-primary underline underline-offset-2">
          Create one
        </Link>
      </p>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-5" aria-hidden="true">
      <Skeleton className="h-[3.9rem]" />
      <Skeleton className="h-[3.9rem]" />
      <Skeleton className="h-10" />
    </div>
  );
}
