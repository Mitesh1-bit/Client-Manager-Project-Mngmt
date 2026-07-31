/**
 * HttpOnly auth cookie defaults for Next.js route handlers.
 *
 * Local HTTP dev (localhost or LAN IP) must use COOKIE_SECURE=false — otherwise
 * browsers refuse Secure cookies over http:// and login appears to "do nothing".
 */
export function authCookieOptions(overrides = {}) {
  let secure = process.env.NODE_ENV === "production";
  if (process.env.COOKIE_SECURE === "false") secure = false;
  if (process.env.COOKIE_SECURE === "true") secure = true;

  return {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    ...overrides,
  };
}
