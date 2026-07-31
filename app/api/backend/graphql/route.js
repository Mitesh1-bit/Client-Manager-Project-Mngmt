import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  PORTAL_REFRESH_COOKIE,
  REFRESH_COOKIE,
  SESSION_COOKIE,
} from "@/app/lib/auth/token";
import { authCookieOptions } from "@/app/lib/auth/cookie-options";

/**
 * Same-origin GraphQL proxy to the FastAPI backend.
 *
 * Keeps refresh tokens on the Next.js origin (cpm_refresh) while forwarding
 * them as backend cookie names (refresh_token / portal_refresh_token).
 * Access tokens stay in cpm_session and are sent as Authorization.
 */
export const runtime = "nodejs";

const BACKEND_GRAPHQL_URL =
  process.env.BACKEND_GRAPHQL_URL || "http://127.0.0.1:8000/graphql";

const PROXY_DEBUG = process.env.GRAPHQL_PROXY_DEBUG === "true";

/** @param {string} body */
function operationLabel(body) {
  try {
    const parsed = JSON.parse(body);
    return parsed.operationName || "(anonymous)";
  } catch {
    return "(unparseable)";
  }
}

const BACKEND_REFRESH = "refresh_token";
const BACKEND_PORTAL_REFRESH = "portal_refresh_token";

/** @param {import("next/dist/compiled/@edge-runtime/cookies").ReadonlyRequestCookies} cookieStore */
function backendCookieHeader(cookieStore) {
  const parts = [];
  const refresh = cookieStore.get(REFRESH_COOKIE)?.value;
  if (refresh) parts.push(`${BACKEND_REFRESH}=${refresh}`);
  const portalRefresh = cookieStore.get(PORTAL_REFRESH_COOKIE)?.value;
  if (portalRefresh) parts.push(`${BACKEND_PORTAL_REFRESH}=${portalRefresh}`);
  return parts.join("; ");
}

/** @param {Response} upstream @param {NextResponse} response */
function forwardSetCookies(upstream, response) {
  const setCookies =
    typeof upstream.headers.getSetCookie === "function"
      ? upstream.headers.getSetCookie()
      : [];

  for (const raw of setCookies) {
    const [nameValue] = raw.split(";");
    const eq = nameValue.indexOf("=");
    if (eq === -1) continue;
    const name = nameValue.slice(0, eq).trim();
    const value = nameValue.slice(eq + 1).trim();
    const maxAgeMatch = raw.match(/Max-Age=(\d+)/i);
    const expiresMatch = raw.match(/Expires=([^;]+)/i);
    const isDelete = /Max-Age=0/i.test(raw) || value === '""' || value === "";

    const options = authCookieOptions();
    if (isDelete) {
      options.maxAge = 0;
    } else if (maxAgeMatch) {
      options.maxAge = Number(maxAgeMatch[1]);
    } else if (expiresMatch) {
      options.expires = new Date(expiresMatch[1]);
    }

    if (name === BACKEND_REFRESH) {
      response.cookies.set(REFRESH_COOKIE, isDelete ? "" : value, options);
    } else if (name === BACKEND_PORTAL_REFRESH) {
      response.cookies.set(PORTAL_REFRESH_COOKIE, isDelete ? "" : value, options);
    }
  }
}

export async function POST(request) {
  const body = await request.text();
  const cookieStore = await cookies();
  const operation = operationLabel(body);

  const headers = new Headers({
    accept: "application/json",
    "content-type": "application/json",
  });

  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
  const incomingAuth = request.headers.get("authorization");
  if (sessionToken) {
    headers.set("authorization", `Bearer ${sessionToken}`);
  } else if (incomingAuth) {
    headers.set("authorization", incomingAuth);
  }

  const cookieParts = [];
  const mapped = backendCookieHeader(cookieStore);
  if (mapped) cookieParts.push(mapped);
  const incomingCookie = request.headers.get("cookie");
  if (incomingCookie) cookieParts.push(incomingCookie);
  if (cookieParts.length) headers.set("cookie", cookieParts.join("; "));

  const upstream = await fetch(BACKEND_GRAPHQL_URL, {
    method: "POST",
    headers,
    body,
    cache: "no-store",
  });

  const text = await upstream.text();
  if (PROXY_DEBUG) {
    console.info(
      `[graphql-proxy] ${operation} -> ${upstream.status} auth=${Boolean(sessionToken || incomingAuth)}`,
    );
  }
  const response = new NextResponse(text, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") || "application/json",
    },
  });

  forwardSetCookies(upstream, response);
  return response;
}
