import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { readRequestCookie } from "@/app/lib/auth/read-request-cookie";
import { SESSION_COOKIE, isExpired, readTokenClaims } from "@/app/lib/auth/token";

/**
 * Same-origin download proxy — lets a plain `<a href>` reach a file that
 * actually requires an access token, without exposing that token to client
 * JS. The session cookie is read here, server-side, same as the GraphQL
 * proxy, and forwarded as the Authorization header the backend expects.
 */
export const runtime = "nodejs";

const BACKEND_BASE_URL =
  (process.env.BACKEND_GRAPHQL_URL || "http://127.0.0.1:8000/graphql").replace(/\/graphql$/, "");

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  if (!path) {
    return NextResponse.json({ detail: "Missing path" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const token = readRequestCookie(request, cookieStore, SESSION_COOKIE);
  const claims = token ? readTokenClaims(token) : null;
  if (!token || isExpired(claims)) {
    return NextResponse.json({ detail: "Not signed in" }, { status: 401 });
  }

  const upstream = await fetch(
    `${BACKEND_BASE_URL}/assets/download?path=${encodeURIComponent(path)}`,
    { headers: { authorization: `Bearer ${token}` }, cache: "no-store" },
  );

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") || "application/octet-stream",
      "content-disposition": upstream.headers.get("content-disposition") || "attachment",
    },
  });
}
