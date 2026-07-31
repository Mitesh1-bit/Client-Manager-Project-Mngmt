/**
 * Consistent logging + copy for Next.js route `error.jsx` boundaries.
 */

/** @param {string} scope @param {Error & { digest?: string, graphQLErrors?: unknown[] }} error */
export function logRouteError(scope, error) {
  const payload = {
    scope,
    message: error?.message,
    digest: error?.digest,
    stack: error?.stack,
  };

  if (error?.graphQLErrors?.length) {
    payload.graphQLErrors = error.graphQLErrors.map((entry) => ({
      message: entry.message,
      path: entry.path,
      locations: entry.locations,
    }));
  }

  console.error(`[Route error:${scope}]`, payload);
  return payload;
}

/** @param {Error & { digest?: string, stack?: string }} error */
export function formatRouteErrorDescription(error) {
  const parts = [error?.message || "Something went wrong while loading this page."];

  if (error?.digest) {
    parts.push(`Reference: ${error.digest}`);
  }

  if (process.env.NODE_ENV === "development" && error?.stack) {
    parts.push(error.stack.split("\n").slice(0, 5).join("\n"));
  }

  return parts.join("\n\n");
}
