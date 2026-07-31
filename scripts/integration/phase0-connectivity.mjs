#!/usr/bin/env node
/**
 * Phase 0 — connectivity checks (backend + optional frontend proxy).
 *
 * Usage:
 *   node scripts/integration/phase0-connectivity.mjs
 *   FRONTEND_BASE=http://127.0.0.1:3000 node scripts/integration/phase0-connectivity.mjs
 */

const BACKEND = process.env.BACKEND_GRAPHQL_URL || "http://127.0.0.1:8000/graphql";
const FRONTEND = process.env.FRONTEND_BASE || "http://127.0.0.1:3000";

async function gql(url, query, variables) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const body = await response.json().catch(() => null);
  return { status: response.status, body };
}

function pass(name, detail = "") {
  console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  process.exitCode = 1;
}

const statusQuery = "{ status }";

console.log("Phase 0: API connectivity\n");

const backend = await gql(BACKEND, statusQuery);
if (backend.status === 200 && backend.body?.data?.status === "ok") {
  pass("Backend GraphQL", BACKEND);
} else {
  fail("Backend GraphQL", JSON.stringify(backend.body));
}

try {
  const proxy = await gql(`${FRONTEND}/api/backend/graphql`, statusQuery);
  if (proxy.status === 200 && proxy.body?.data?.status === "ok") {
    pass("Frontend proxy", `${FRONTEND}/api/backend/graphql`);
  } else {
    fail("Frontend proxy (start npm run dev first)", JSON.stringify(proxy.body));
  }
} catch (error) {
  fail("Frontend proxy", error.message);
}

console.log(process.exitCode ? "\nPhase 0 incomplete." : "\nPhase 0 complete.");
