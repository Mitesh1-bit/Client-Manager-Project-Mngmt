"use client";

import { PageHeader } from "@/app/components/domain/page-header";
import { ErrorState } from "@/app/components/domain/states";

export default function ChangeRequestsError({ error, reset }) {
  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Change requests"
        description="Everything clients have asked for, what needs assessing, and what's waiting on a decision."
      />
      <ErrorState
        title="We couldn't load change requests"
        description={
          error?.message ??
          "The request to the API failed. This is usually temporary — try again."
        }
        onRetry={reset}
      />
    </>
  );
}
