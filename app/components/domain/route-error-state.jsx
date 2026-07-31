"use client";

import { useEffect } from "react";

import { ErrorState } from "@/app/components/domain/states";
import { formatRouteErrorDescription, logRouteError } from "@/app/lib/route-error";

/**
 * Shared error UI for App Router segments. Logs to the browser console (and
 * the Node terminal for SSR) with digest + stack in development.
 */
export function RouteErrorState({ scope, title, error, reset }) {
  useEffect(() => {
    logRouteError(scope, error);
  }, [scope, error]);

  return (
    <ErrorState
      title={title}
      description={formatRouteErrorDescription(error)}
      onRetry={reset}
    />
  );
}
