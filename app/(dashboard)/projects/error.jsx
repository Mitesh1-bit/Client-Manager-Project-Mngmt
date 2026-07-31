"use client";

import { ErrorState } from "@/app/components/domain/states";
import { PageHeader } from "@/app/components/domain/page-header";

export default function ProjectsError({ error, reset }) {
  return (
    <>
      <PageHeader eyebrow="Delivery" title="Projects" />
      <ErrorState
        title="We couldn't load projects"
        description={error?.message ?? "The request to the API failed. Try again."}
        onRetry={reset}
      />
    </>
  );
}
