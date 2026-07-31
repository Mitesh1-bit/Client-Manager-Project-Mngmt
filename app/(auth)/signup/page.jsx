import Link from "next/link";
import { Suspense } from "react";

import { Skeleton } from "@/app/components/ui/skeleton";

import { SignupForm } from "./signup-form";

export const metadata = { title: "Create your workspace" };

export default function SignupPage() {
  return (
    <div>
      <h1 className="font-mkt-display text-title text-mkt-navy">Create your workspace</h1>
      <p className="mt-2 text-caption text-mkt-navy/70">
        Set up your agency, invite your team, and bring your clients into the portal.
      </p>

      <div className="mt-8">
        <Suspense fallback={<FormSkeleton />}>
          <SignupForm />
        </Suspense>
      </div>

      <p className="mt-8 text-caption text-mkt-navy/70">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-mkt-cta underline underline-offset-2 hover:text-mkt-cta-hover">
          Sign in
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
      <Skeleton className="h-[3.9rem]" />
      <Skeleton className="h-[3.9rem]" />
      <Skeleton className="h-[3.9rem]" />
      <Skeleton className="h-10" />
    </div>
  );
}
