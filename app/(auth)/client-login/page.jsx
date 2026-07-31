import { Suspense } from "react";
import Link from "next/link";

import { PageHeader } from "@/app/components/domain/page-header";
import { Skeleton } from "@/app/components/ui/skeleton";
import { mktFontClassName } from "@/app/lib/marketing/fonts";

import { ClientLoginForm } from "./client-login-form";

export const metadata = { title: "Client portal sign in" };

export default function ClientLoginPage() {
  return (
    <div className={`${mktFontClassName} mx-auto w-full max-w-md px-4 py-12`}>
      <PageHeader
        title="Client portal"
        description="Sign in to view your projects, approvals, and change requests."
      />
      <Suspense fallback={<FormSkeleton />}>
        <ClientLoginForm />
      </Suspense>
      <p className="mt-6 text-center text-caption text-muted-foreground">
        <Link href="/" className="hover:underline">
          Back to home
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
