"use client";

import { ErrorState } from "@/app/components/domain/states";

export default function PortalError({ error, reset }) {
  return (
    <ErrorState
      title="We couldn't load this"
      description={
        error?.message ??
        "Something went wrong on our side. Try again, and let your project manager know if it keeps happening."
      }
      onRetry={reset}
    />
  );
}
