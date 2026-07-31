export const LOGIN_PATH = "/login";
export const CLIENT_LOGIN_PATH = "/client-login";
export const PORTAL_HOME = "/portal";
export const DASHBOARD_HOME = "/dashboard";

const AUTH_PATHS = ["/login", "/signup", "/sso", "/client-login"];

/** Public marketing pages — no auth required (see landing-page brief). */
export const MARKETING_PREFIXES = [
  "/product",
  "/solutions",
  "/blog",
  "/privacy",
  "/terms",
];

/** @param {string} pathname */
export function isMarketingRoute(pathname) {
  if (pathname === "/") return true;
  return MARKETING_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

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
 * @param {{ pathname: string, search?: string, session: { scope: 'INTERNAL' | 'PORTAL' } | null }} input
 * @returns {string | null}
 */
export function resolveRedirect({ pathname, search = "", session }) {
  if (isAuthRoute(pathname)) {
    return session ? homePathForScope(session.scope) : null;
  }

  if (isMarketingRoute(pathname)) {
    if (session && pathname === "/") {
      return homePathForScope(session.scope);
    }
    return null;
  }

  if (!session) {
    const next = `${pathname}${search}`;
    if (isPortalRoute(pathname)) {
      return `${CLIENT_LOGIN_PATH}?next=${encodeURIComponent(next)}`;
    }
    return `${LOGIN_PATH}?next=${encodeURIComponent(next)}`;
  }

  const onPortalRoute = isPortalRoute(pathname);
  if (session.scope === "PORTAL" && !onPortalRoute) return PORTAL_HOME;
  if (session.scope === "INTERNAL" && onPortalRoute) return DASHBOARD_HOME;

  return null;
}

/**
 * @param {string | null | undefined} next
 * @param {'INTERNAL' | 'PORTAL'} scope
 */
export function safeNextPath(next, scope) {
  const fallback = homePathForScope(scope);
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  if (isAuthRoute(next)) return fallback;
  if (scope === "PORTAL" && next === CLIENT_LOGIN_PATH) return fallback;
  const portalTarget = isPortalRoute(next);
  if (scope === "PORTAL" && !portalTarget) return fallback;
  if (scope === "INTERNAL" && portalTarget) return fallback;
  return next;
}
