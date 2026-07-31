"use client";

import { RouteErrorState } from "@/app/components/domain/route-error-state";

export default function CompanyDetailError({ error, reset }) {
  return (
    <RouteErrorState
      scope="company-detail"
      title="We couldn't load this section"
      error={error}
      reset={reset}
    />
  );
}
