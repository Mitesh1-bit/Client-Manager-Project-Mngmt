"use client";

import { ErrorState } from "@/app/components/domain/states";
import { PageHeader } from "@/app/components/domain/page-header";

export default function SearchError({ error, reset }) {
  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Search"
        description="One search across companies, contacts, projects and tasks."
      />
      <ErrorState
        title="We couldn't run that search"
        description={
          error?.message ?? "The request to the API failed. This is usually temporary — try again."
        }
        onRetry={reset}
      />
    </>
  );
}
