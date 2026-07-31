"use client";

import { ErrorState } from "@/app/components/domain/states";
import { PageHeader } from "@/app/components/domain/page-header";

export default function CompaniesError({ error, reset }) {
  return (
    <>
      <PageHeader eyebrow="Clients" title="Companies" />
      <ErrorState
        title="We couldn't load companies"
        description={
          error?.message ??
          "The request to the API failed. This is usually temporary — try again."
        }
        onRetry={reset}
      />
    </>
  );
}
