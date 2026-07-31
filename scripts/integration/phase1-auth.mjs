#!/usr/bin/env node
/**
 * Phase 1 — auth + security smoke (via frontend proxy when available).
 *
 * Loads seed credentials from backend/.env when not in process env.
 * Does not print passwords.
 *
 * Usage:
 *   node scripts/integration/phase1-auth.mjs
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const GRAPHQL =
  process.env.GRAPHQL_URL ||
  `${process.env.FRONTEND_BASE || "http://127.0.0.1:3000"}/api/backend/graphql`;

function readBackendEnv(name) {
  if (process.env[name]) return process.env[name];
  try {
    const envPath = resolve(dirname(fileURLToPath(import.meta.url)), "../../../backend/.env");
    const text = readFileSync(envPath, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      if (key !== name) continue;
      return trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    /* optional */
  }
  return undefined;
}

const ADMIN_EMAIL = readBackendEnv("SEED_ADMIN_EMAIL");
const ADMIN_PASSWORD = readBackendEnv("SEED_ADMIN_PASSWORD");

async function gql(query, variables, headers = {}) {
  const response = await fetch(GRAPHQL, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", ...headers },
    body: JSON.stringify({ query, variables }),
    redirect: "manual",
  });
  const setCookie = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
  const body = await response.json().catch(() => null);
  return { status: response.status, body, setCookie, headers: response.headers };
}

function pass(name, detail = "") {
  console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  process.exitCode = 1;
}

function cookieHeaderFrom(setCookies) {
  return setCookies.map((c) => c.split(";")[0]).join("; ");
}

console.log("Phase 1: Auth integration + security\n");

const anonMe = await gql("{ me { id } }");
if (anonMe.body?.data?.me === null) {
  pass("Anonymous me returns null");
} else {
  fail("Anonymous me should be null", JSON.stringify(anonMe.body));
}

const badLogin = await gql(
  `mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) { accessToken requires2fa }
  }`,
  { email: ADMIN_EMAIL || "admin@test.local", password: "definitely-wrong-password" },
);
if (badLogin.body?.errors?.length) {
  pass("Invalid credentials rejected");
} else {
  fail("Invalid credentials should error", JSON.stringify(badLogin.body));
}

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.warn("SKIP  Seeded login (set SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD in env)");
} else {
  const login = await gql(
    `mutation Login($email: String!, $password: String!) {
      login(email: $email, password: $password) { accessToken requires2fa challengeToken }
    }`,
    { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  );

  const token = login.body?.data?.login?.accessToken;
  if (token && !login.body?.data?.login?.requires2fa) {
    pass("Valid login returns accessToken");
  } else {
    fail("Valid login", JSON.stringify(login.body));
  }

  if (token) {
    const refreshCookies = cookieHeaderFrom(login.setCookie);
    const authed = await gql(
      `{ me { id email scope role organization { name } } }`,
      undefined,
      {
        authorization: `Bearer ${token}`,
        ...(refreshCookies ? { cookie: refreshCookies } : {}),
      },
    );
    const me = authed.body?.data?.me;
    if (me?.scope === "INTERNAL" && me?.email === ADMIN_EMAIL) {
      pass("Authenticated me query", me.organization?.name || "org ok");
    } else {
      fail("Authenticated me query", JSON.stringify(authed.body));
    }

    const companies = await gql("{ companies { id name } }", undefined, {
      authorization: `Bearer ${token}`,
    });
    if (Array.isArray(companies.body?.data?.companies)) {
      pass("Authorized companies query");
    } else {
      fail("Authorized companies query", JSON.stringify(companies.body));
    }

    const noAuthCompanies = await gql("{ companies { id } }");
    if (noAuthCompanies.body?.errors?.length) {
      pass("Unauthenticated companies blocked");
    } else {
      fail("Unauthenticated companies should fail", JSON.stringify(noAuthCompanies.body));
    }
  }
}

console.log(process.exitCode ? "\nPhase 1 incomplete." : "\nPhase 1 complete.");
