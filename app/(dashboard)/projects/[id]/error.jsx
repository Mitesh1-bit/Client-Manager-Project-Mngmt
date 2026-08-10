"use client";

import { ErrorState } from "@/app/components/domain/states";

export default function ProjectDetailError({ error, reset }) {
  return (
    <ErrorState
      title="We couldn't load this view"
      description={error?.message ?? "The request to the API failed. Try again."}
      onRetry={reset}
    />
  );
}
