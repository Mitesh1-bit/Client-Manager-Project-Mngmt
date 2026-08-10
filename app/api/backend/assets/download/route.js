import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { readRequestCookie } from "@/app/lib/auth/read-request-cookie";
import { SESSION_COOKIE, isExpired, readTokenClaims } from "@/app/lib/auth/token";

export const runtime = "nodejs";

const BACKEND_BASE_URL =
  (process.env.BACKEND_GRAPHQL_URL || "http://127.0.0.1:8000/graphql").replace(/\/graphql$/, "");

async function proxyAsset(request, backendPath) {
  const cookieStore = await cookies();
  const token = readRequestCookie(request, cookieStore, SESSION_COOKIE);
  const claims = token ? readTokenClaims(token) : null;
  if (!token || isExpired(claims)) {
    return NextResponse.json({ detail: "Not signed in" }, { status: 401 });
  }

  const upstream = await fetch(`${BACKEND_BASE_URL}${backendPath}`, {
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const headers = new Headers();
  headers.set("content-type", upstream.headers.get("content-type") || "application/octet-stream");
  const disposition = upstream.headers.get("content-disposition");
  if (disposition) headers.set("content-disposition", disposition);
  headers.set("x-content-type-options", "nosniff");

  return new NextResponse(upstream.body, { status: upstream.status, headers });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  const disposition = searchParams.get("disposition") || "attachment";
  if (!path) {
    return NextResponse.json({ detail: "Missing path" }, { status: 400 });
  }
  return proxyAsset(
    request,
    `/assets/download?path=${encodeURIComponent(path)}&disposition=${encodeURIComponent(disposition)}`,
  );
}
