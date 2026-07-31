"use client";

import { PageHeader } from "@/app/components/domain/page-header";
import { ErrorState } from "@/app/components/domain/states";

export default function RetentionError({ error, reset }) {
  return (
    <>
      <PageHeader eyebrow="Operations" title="Retention" />
      <ErrorState
        title="We couldn't load this"
        description={error?.message ?? "The request to the API failed. Try again."}
        onRetry={reset}
      />
    </>
  );
}
