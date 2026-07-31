export const LOGIN_PATH = "/login";
export const PORTAL_HOME = "/portal";
export const DASHBOARD_HOME = "/";

const AUTH_PATHS = ["/login", "/signup", "/sso"];

/** @param {string} pathname */
export function isAuthRoute(pathname) {
  return AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/** @param {string} pathname */
export function isPortalRoute(pathname) {
  return pathname === PORTAL_HOME || pathname.startsWith(`${PORTAL_HOME}/`);
}

/** @param {'INTERNAL' | 'PORTAL' | undefined} scope */
export function homePathForScope(scope) {
  return scope === "PORTAL" ? PORTAL_HOME : DASHBOARD_HOME;
}

/**
 * Decides where a request should go, given the caller's session. Returns null
 * when the request may proceed untouched.
 *
 * Pure so it can be unit tested without a Next.js request.
 *
 * @param {{ pathname: string, search?: string, session: { scope: 'INTERNAL' | 'PORTAL' } | null }} input
 * @returns {string | null}
 */
export function resolveRedirect({ pathname, search = "", session }) {
  if (isAuthRoute(pathname)) {
    return session ? homePathForScope(session.scope) : null;
  }

  if (!session) {
    const next = `${pathname}${search}`;
    return next === DASHBOARD_HOME
      ? LOGIN_PATH
      : `${LOGIN_PATH}?next=${encodeURIComponent(next)}`;
  }

  const onPortalRoute = isPortalRoute(pathname);
  if (session.scope === "PORTAL" && !onPortalRoute) return PORTAL_HOME;
  if (session.scope === "INTERNAL" && onPortalRoute) return DASHBOARD_HOME;

  return null;
}

/**
 * `next` arrives from the query string, so it must never be trusted as a
 * redirect target beyond this app.
 *
 * @param {string | null | undefined} next
 * @param {'INTERNAL' | 'PORTAL'} scope
 */
export function safeNextPath(next, scope) {
  const fallback = homePathForScope(scope);
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  if (isAuthRoute(next)) return fallback;
  const portalTarget = isPortalRoute(next);
  if (scope === "PORTAL" && !portalTarget) return fallback;
  if (scope === "INTERNAL" && portalTarget) return fallback;
  return next;
}
