import { onError } from "@apollo/client/link/error";

/**
 * Logs GraphQL and network failures with the operation name so server/client
 * terminals show where a tab crash started.
 *
 * @param {"client" | "server"} scope
 */
export function createGraphqlErrorLink(scope) {
  return onError(({ graphQLErrors, networkError, operation }) => {
    const name = operation.operationName || "anonymous";

    if (graphQLErrors?.length) {
      for (const err of graphQLErrors) {
        console.error(`[GraphQL:${scope}] ${name}`, {
          message: err.message,
          path: err.path,
          locations: err.locations,
          extensions: err.extensions,
        });
      }
    }

    if (networkError) {
      console.error(`[GraphQL:${scope}] ${name} network`, networkError);
    }
  });
}
