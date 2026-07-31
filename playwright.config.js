import { defineConfig, devices } from "@playwright/test";

/**
 * The mock GraphQL layer keeps its data in a single in-memory object for the
 * life of the dev server process — there's no per-request isolation. Tests
 * run serially, single-worker, against one server instance so one test's
 * writes (a created project, a moved task) can't race another's reads.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  // A cold `next dev` compiles each route on its first hit — give the first
  // test in the run headroom for that across a few routes.
  timeout: 45_000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: false,
    timeout: 60_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
