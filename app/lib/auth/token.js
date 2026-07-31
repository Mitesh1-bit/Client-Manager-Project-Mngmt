export const SESSION_COOKIE = "cpm_session";
export const REFRESH_COOKIE = "cpm_refresh";
export const PORTAL_REFRESH_COOKIE = "cpm_portal_refresh";

const ACTOR_SCOPE = {
  internal: "INTERNAL",
  portal: "PORTAL",
};

function base64UrlDecode(segment) {
  const padded = segment.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Reads the claims out of an access token without verifying its signature.
 * Verification is the API's job — this only drives navigation and chrome.
 *
 * Normalizes backend JWT (`actor_type`) and mock tokens (`scope`).
 *
 * @param {string | undefined | null} token
 * @returns {{ sub: string, scope: 'INTERNAL' | 'PORTAL', email?: string, name?: string, role?: string, companyId?: string, org_id?: string, actor_type?: string, exp: number } | null}
 */
export function readTokenClaims(token) {
  if (!token) return null;
  const segments = token.split(".");
  if (segments.length !== 3) return null;
  try {
    const claims = JSON.parse(base64UrlDecode(segments[1]));
    if (!claims || typeof claims.sub !== "string") return null;

    const scope =
      claims.scope === "INTERNAL" || claims.scope === "PORTAL"
        ? claims.scope
        : ACTOR_SCOPE[claims.actor_type] ?? null;
    if (!scope) return null;

    return {
      ...claims,
      scope,
      companyId: claims.companyId ?? claims.company_id,
    };
  } catch {
    return null;
  }
}

/** @param {{ exp?: number } | null} claims */
export function isExpired(claims) {
  if (!claims || typeof claims.exp !== "number") return true;
  return claims.exp * 1000 <= Date.now();
}
