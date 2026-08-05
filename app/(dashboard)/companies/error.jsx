"use client";

import { ErrorState } from "@/app/components/domain/states";
import { PageHeader } from "@/app/components/domain/page-header";

export default function CompaniesError({ error, reset }) {
  return (
    <>
      <PageHeader eyebrow="Clients" title="Clients" />
      <ErrorState
        title="We couldn't load clients"
        description={
          error?.message ??
          "The request to the API failed. This is usually temporary — try again."
        }
        onRetry={reset}
      />
    </>
  );
}
