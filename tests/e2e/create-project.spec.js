import { expect, test } from "@playwright/test";

import { USERS, login } from "./helpers/auth";

test("a PM can create a project for a client and land on its detail page", async ({ page }) => {
  await login(page, USERS.admin);

  await page.goto("/projects/new");
  await expect(page.getByRole("heading", { name: /new project/i })).toBeVisible();

  const projectName = `Playwright Test Project ${Date.now()}`;
  await page.getByLabel(/project name/i).fill(projectName);

  await page.getByRole("combobox", { name: /client/i }).click();
  await page.getByRole("option", { name: "Northwind Health" }).click();

  await page.getByLabel(/start date/i).fill("2026-09-01");
  await page.getByLabel(/end date/i).fill("2026-12-01");

  await page.getByRole("button", { name: /create project/i }).click();

  // The bare /projects/{id} route redirects straight to the board tab —
  // there's no separate overview page.
  await page.waitForURL(/\/projects\/[^/]+\/board$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: projectName })).toBeVisible();
  await expect(page.getByText("Northwind Health")).toBeVisible();

  // It should now show up in the org-wide project list too.
  await page.goto("/projects");
  await expect(page.getByRole("link", { name: projectName })).toBeVisible();
});
