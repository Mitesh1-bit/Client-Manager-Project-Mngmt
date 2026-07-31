"use client";

import { safeNextPath } from "@/app/lib/auth/routes";

/**
 * Shared post-auth session bootstrap — used by login and signup forms.
 * @param {import("@apollo/client").ApolloClient<object>} apollo
 * @param {string} accessToken
 * @param {string | null | undefined} nextPath
 */
export async function establishSession(apollo, accessToken, nextPath) {
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ accessToken }),
    credentials: "same-origin",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "We couldn't start your session. Try again.");
  }

  const session = await response.json();
  await apollo.clearStore();

  const destination = safeNextPath(nextPath, session.scope);
  // Full navigation so the browser sends the new httpOnly cookie on the next request.
  window.location.assign(destination);
}
