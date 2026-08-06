import { NextResponse } from "next/server";

import { resolveRedirect } from "@/app/lib/auth/routes";
import { SESSION_COOKIE, isExpired, readTokenClaims } from "@/app/lib/auth/token";

/**
 * Route protection. Next 16 renamed the middleware convention to `proxy`; this
 * is the same edge hook the spec asks for.
 *
 * Claims are read without verifying the signature, which is safe because this
 * only decides where to send the browser — every GraphQL request is
 * re-authenticated by the API.
 */
export default function proxy(request) {
  const claims = readTokenClaims(request.cookies.get(SESSION_COOKIE)?.value);
  const session = isExpired(claims) ? null : claims;

  const target = resolveRedirect({
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    session,
  });

  if (!target) {
    const response = NextResponse.next();
    response.headers.set("x-pathname", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return response;
  }

  const url = request.nextUrl.clone();
  const [path, query = ""] = target.split("?");
  url.pathname = path;
  url.search = query;

  const response = NextResponse.redirect(url);
  if (claims && !session) response.cookies.delete(SESSION_COOKIE);
  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|mock-files|robots\\.txt|sitemap\\.xml|llms\\.txt|llms-full\\.txt|opengraph-image|icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
