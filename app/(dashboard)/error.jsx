"use client";

import { PageHeader } from "@/app/components/domain/page-header";
import { ErrorState } from "@/app/components/domain/states";

export default function DashboardError({ error, reset }) {
  return (
    <>
      <PageHeader eyebrow="Workspace" title="Dashboard" />
      <ErrorState
        title="Something went wrong"
        description={
          error?.message ??
          "The request to the API failed. This is usually temporary — try again."
        }
        onRetry={reset}
      />
    </>
  );
}
