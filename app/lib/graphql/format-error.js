/**
 * @param {unknown} error
 * @param {string} [fallback]
 */
export function formatGraphqlError(error, fallback = "Something went wrong. Try again.") {
  if (error && typeof error === "object") {
    const withErrors = /** @type {{ errors?: { message?: string }[] }} */ (error);
    const combinedMessage = withErrors.errors?.[0]?.message;
    if (combinedMessage) return combinedMessage;

    const gqlErrors = /** @type {{ graphQLErrors?: { message?: string }[] }} */ (error).graphQLErrors;
    const gqlMessage = gqlErrors?.[0]?.message;
    if (gqlMessage) return gqlMessage;

    const message = /** @type {{ message?: string }} */ (error).message;
    if (message && message !== "Unexpected error.") return message;
  }
  return fallback;
}
