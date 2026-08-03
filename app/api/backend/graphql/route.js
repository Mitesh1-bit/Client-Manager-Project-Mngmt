import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { readRequestCookie } from "@/app/lib/auth/read-request-cookie";
import {
  PORTAL_REFRESH_COOKIE,
  REFRESH_COOKIE,
  SESSION_COOKIE,
  isExpired,
  readTokenClaims,
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

const REFRESH_MUTATIONS = {
  internal: {
    operation: "RefreshToken",
    field: "refreshToken",
    refreshCookie: REFRESH_COOKIE,
    backendCookie: BACKEND_REFRESH,
  },
  portal: {
    operation: "PortalRefreshToken",
    field: "portalRefreshToken",
    refreshCookie: PORTAL_REFRESH_COOKIE,
    backendCookie: BACKEND_PORTAL_REFRESH,
  },
};

/**
 * @param {Request} request
 * @param {import("next/dist/compiled/@edge-runtime/cookies").ReadonlyRequestCookies} cookieStore
 */
function readValidSessionToken(request, cookieStore) {
  const token = readRequestCookie(request, cookieStore, SESSION_COOKIE);
  if (!token) return null;
  const claims = readTokenClaims(token);
  if (isExpired(claims)) return null;
  return token;
}

/**
 * @param {Request} request
 * @param {import("next/dist/compiled/@edge-runtime/cookies").ReadonlyRequestCookies} cookieStore
 * @param {"internal" | "portal"} kind
 */
async function refreshAccessToken(request, cookieStore, kind) {
  const config = REFRESH_MUTATIONS[kind];
  const refreshValue = readRequestCookie(request, cookieStore, config.refreshCookie);
  if (!refreshValue) return null;

  const upstream = await fetch(BACKEND_GRAPHQL_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      cookie: `${config.backendCookie}=${refreshValue}`,
    },
    body: JSON.stringify({
      operationName: config.operation,
      query: `mutation ${config.operation} { ${config.field} { accessToken } }`,
    }),
    cache: "no-store",
  });

  const payload = await upstream.json().catch(() => null);
  const accessToken = payload?.data?.[config.field]?.accessToken ?? null;
  if (!accessToken) return null;

  return { accessToken, upstream };
}

/**
 * @param {Request} request
 * @param {import("next/dist/compiled/@edge-runtime/cookies").ReadonlyRequestCookies} cookieStore
 */
async function resolveAccessToken(request, cookieStore) {
  const existing = readValidSessionToken(request, cookieStore);
  if (existing) return { accessToken: existing, refreshUpstream: null };

  for (const kind of /** @type {const} */ (["internal", "portal"])) {
    const refreshed = await refreshAccessToken(request, cookieStore, kind);
    if (refreshed?.accessToken) return refreshed;
  }

  return { accessToken: null, refreshUpstream: null };
}

/** @param {Request} request @param {import("next/dist/compiled/@edge-runtime/cookies").ReadonlyRequestCookies} cookieStore */
function backendCookieHeader(request, cookieStore) {
  const parts = [];
  const refresh =
    readRequestCookie(request, cookieStore, REFRESH_COOKIE) ??
    cookieStore.get(REFRESH_COOKIE)?.value;
  if (refresh) parts.push(`${BACKEND_REFRESH}=${refresh}`);

  const portalRefresh =
    readRequestCookie(request, cookieStore, PORTAL_REFRESH_COOKIE) ??
    cookieStore.get(PORTAL_REFRESH_COOKIE)?.value;
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

/** @param {NextResponse} response @param {string} accessToken */
function setSessionCookie(response, accessToken) {
  const claims = readTokenClaims(accessToken);
  if (!claims) return;
  response.cookies.set(SESSION_COOKIE, accessToken, {
    ...authCookieOptions(),
    expires: new Date(claims.exp * 1000),
  });
}

export async function POST(request) {
  const body = await request.text();
  const cookieStore = await cookies();
  const operation = operationLabel(body);

  const { accessToken, refreshUpstream } = await resolveAccessToken(request, cookieStore);

  const headers = new Headers({
    accept: "application/json",
    "content-type": "application/json",
  });

  const incomingAuth = request.headers.get("authorization");
  if (accessToken) {
    headers.set("authorization", `Bearer ${accessToken}`);
  } else if (incomingAuth) {
    headers.set("authorization", incomingAuth);
  }

  const cookieParts = [];
  const mapped = backendCookieHeader(request, cookieStore);
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
      `[graphql-proxy] ${operation} -> ${upstream.status} auth=${Boolean(accessToken || incomingAuth)} refreshed=${Boolean(refreshUpstream)}`,
    );
  }

  const response = new NextResponse(text, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") || "application/json",
    },
  });

  if (accessToken && !readValidSessionToken(request, cookieStore)) {
    setSessionCookie(response, accessToken);
  }

  if (refreshUpstream) forwardSetCookies(refreshUpstream, response);
  forwardSetCookies(upstream, response);
  return response;
}
