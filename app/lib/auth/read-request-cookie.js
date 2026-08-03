/**
 * Read a cookie from Next's cookie store, falling back to the raw Cookie header.
 * Client-side fetch to route handlers sometimes only populates the header.
 *
 * @param {Request} request
 * @param {import("next/dist/compiled/@edge-runtime/cookies").ReadonlyRequestCookies} cookieStore
 * @param {string} name
 */
export function readRequestCookie(request, cookieStore, name) {
  const fromStore = cookieStore.get(name)?.value;
  if (fromStore) return fromStore;

  const header = request.headers.get("cookie");
  if (!header) return null;

  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    if (trimmed.slice(0, eq) === name) {
      return decodeURIComponent(trimmed.slice(eq + 1));
    }
  }

  return null;
}
