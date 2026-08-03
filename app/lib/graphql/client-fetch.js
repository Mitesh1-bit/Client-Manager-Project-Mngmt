"use client";

/**
 * Browser fetch for Apollo — same-origin, always sends httpOnly session cookies.
 *
 * @param {RequestInfo | URL} input
 * @param {RequestInit} [init]
 */
export function clientFetch(input, init = {}) {
  const url =
    typeof input === "string" && input.startsWith("/")
      ? `${window.location.origin}${input}`
      : input;

  return fetch(url, {
    ...init,
    credentials: "include",
    cache: "no-store",
  });
}
