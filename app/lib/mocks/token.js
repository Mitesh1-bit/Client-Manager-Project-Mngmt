function base64UrlEncode(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 8;

/**
 * Produces a JWT-shaped, unsigned token so the frontend can exercise the real
 * decode path. The live backend replaces this with a properly signed JWT.
 */
export function signMockToken(claims, ttlSeconds = ACCESS_TOKEN_TTL_SECONDS) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const header = base64UrlEncode(JSON.stringify({ alg: "none", typ: "JWT" }));
  const payload = base64UrlEncode(JSON.stringify({ ...claims, exp }));
  return { token: `${header}.${payload}.mock`, expiresAt: new Date(exp * 1000).toISOString() };
}
