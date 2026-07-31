#!/usr/bin/env node
/**
 * Phases 2–7 smoke — authenticated list queries via frontend proxy.
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

async function gql(query, variables, headers = {}) {
  const response = await fetch(GRAPHQL, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", ...headers },
    body: JSON.stringify({ query, variables }),
  });
  const setCookie = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
  const body = await response.json().catch(() => null);
  return { body, setCookie };
}

function pass(name) {
  console.log(`PASS  ${name}`);
}

function fail(name, detail) {
  console.error(`FAIL  ${name} — ${detail}`);
  process.exitCode = 1;
}

const email = readBackendEnv("SEED_ADMIN_EMAIL");
const password = readBackendEnv("SEED_ADMIN_PASSWORD");

console.log("Phases 2–7: domain integration smoke\n");

const login = await gql(
  `mutation Login($email: String!, $password: String!) { login(email: $email, password: $password) { accessToken } }`,
  { email, password },
);
const token = login.body?.data?.login?.accessToken;
if (!token) {
  fail("Login", JSON.stringify(login.body));
  process.exit(1);
}
pass("Login");

const auth = { authorization: `Bearer ${token}` };

const checks = [
  ["Companies list", "{ companies { id name contactCount projectCount } }"],
  ["Users list", "{ users { id email } }"],
  ["Projects list", "{ projects { id name companyId } }"],
  ["Change request dashboard", "{ changeRequestDashboard { openCount } }"],
  ["Retention sequences", "{ retentionSequences(activeOnly: false) { id name } }"],
  ["At-risk companies", "{ atRiskCompanies { id name healthScore } }"],
  ["Contracts query", "{ contracts { id name } }"],
  ["Invoices query", "{ invoices { id status } }"],
];

for (const [name, query] of checks) {
  const { body } = await gql(query, undefined, auth);
  if (body?.errors?.length) fail(name, JSON.stringify(body.errors));
  else pass(name);
}

console.log(process.exitCode ? "\nIncomplete." : "\nAll domain smoke checks passed.");
