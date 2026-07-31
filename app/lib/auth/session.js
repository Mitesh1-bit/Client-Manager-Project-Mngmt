import { cookies } from "next/headers";

import { SESSION_COOKIE, isExpired, readTokenClaims } from "./token";

/**
 * Session claims for the current request, for shell/chrome decisions only.
 * Anything that needs real data must query GraphQL, where the API re-verifies
 * the token.
 */
export async function getSessionClaims() {
  const cookieStore = await cookies();
  const claims = readTokenClaims(cookieStore.get(SESSION_COOKIE)?.value);
  return isExpired(claims) ? null : claims;
}
