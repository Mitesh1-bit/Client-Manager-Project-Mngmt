"use client";

import { ErrorState } from "@/app/components/domain/states";

export default function ChangeRequestDetailError({ error, reset }) {
  return (
    <ErrorState
      title="We couldn't load this request"
      description={error?.message ?? "The request to the API failed. Try again."}
      onRetry={reset}
    />
  );
}
