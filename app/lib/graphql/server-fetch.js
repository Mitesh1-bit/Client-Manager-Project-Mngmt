import { cookies, headers } from "next/headers";
import { connection } from "next/server";

import { SESSION_COOKIE } from "@/app/lib/auth/token";

import { isRelativeEndpoint } from "./endpoint";

async function toAbsolute(url) {
  if (!isRelativeEndpoint) return url;
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  const proto = headerStore.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}${url}`;
}

/**
 * Server-side fetch for Apollo: resolves the relative endpoint against the
 * incoming request and forwards the caller's session so RSC queries run as the
 * signed-in user.
 *
 * Every request in the app — mock data today, a live backend later — is
 * per-viewer and must never be baked into a static build shell. `cookies()`
 * and `headers()` below are Next's usual signal that a route needs a real
 * request, but that signal doesn't reliably propagate through Apollo Client's
 * own link/observable chain back to the page component that called
 * `getClient().query()`, several async layers up. `connection()` says the
 * same thing explicitly, at the one place every query passes through, so no
 * page has to remember to declare it itself.
 */
export async function serverFetch(input, init) {
  await connection();
  const cookieStore = await cookies();
  const requestHeaders = new Headers(init?.headers);

  const cookieHeader = cookieStore.toString();
  if (cookieHeader) requestHeaders.set("cookie", cookieHeader);

  const accessToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (accessToken) requestHeaders.set("authorization", `Bearer ${accessToken}`);

  const response = await fetch(await toAbsolute(String(input)), {
    ...init,
    headers: requestHeaders,
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.clone().text().catch(() => "");
    console.error("[GraphQL HTTP]", {
      status: response.status,
      statusText: response.statusText,
      url: String(input),
      body: body.slice(0, 500),
    });
  }

  return response;
}
