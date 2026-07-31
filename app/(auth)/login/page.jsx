import { Suspense } from "react";
import Link from "next/link";

import { Skeleton } from "@/app/components/ui/skeleton";

import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div>
      <h1 className="font-mkt-display text-title text-mkt-navy">Sign in</h1>
      <p className="mt-2 text-caption text-mkt-navy/70">
        Agency staff use your work email. Client contacts use the email and portal password from
        Companies → Contacts — this page tries both automatically.
      </p>

      <div className="mt-8">
        <Suspense fallback={<FormSkeleton />}>
          <LoginForm />
        </Suspense>
      </div>

      <p className="mt-8 text-caption text-mkt-navy/70">
        Need an account for your agency?{" "}
        <Link href="/signup" className="font-medium text-mkt-cta underline underline-offset-2 hover:text-mkt-cta-hover">
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
