import { NextResponse } from "next/server";

import { authCookieOptions } from "@/app/lib/auth/cookie-options";
import { PORTAL_REFRESH_COOKIE, REFRESH_COOKIE, SESSION_COOKIE, readTokenClaims } from "@/app/lib/auth/token";

/**
 * Cookie plumbing only — no business logic. The login mutation runs against
 * GraphQL; this just parks the resulting access token in an httpOnly cookie so
 * middleware can read it and JavaScript cannot.
 *
 * Claims stored here are never trusted for authorisation: the API verifies the
 * token's signature on every request, and this app only uses the claims to
 * decide which shell to render.
 *
 * Once the backend sets the cookie itself on /graphql, delete this route.
 */
export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const accessToken = body?.accessToken;
  const claims = readTokenClaims(accessToken);

  if (!claims) {
    return NextResponse.json({ error: "Malformed access token." }, { status: 400 });
  }

  const response = NextResponse.json({ scope: claims.scope });
  response.cookies.set(SESSION_COOKIE, accessToken, {
    ...authCookieOptions(),
    expires: new Date(claims.exp * 1000),
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  const cleared = authCookieOptions({ maxAge: 0 });
  response.cookies.set(SESSION_COOKIE, "", cleared);
  response.cookies.set(REFRESH_COOKIE, "", cleared);
  response.cookies.set(PORTAL_REFRESH_COOKIE, "", cleared);
  return response;
}
