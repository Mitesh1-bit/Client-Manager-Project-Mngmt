import { expect, test } from "@playwright/test";

import { USERS, login } from "./helpers/auth";

test("a PM can mark a scheduled touchpoint complete, recording an outcome", async ({ page }) => {
  await login(page, USERS.admin);

  await page.goto("/companies/cmp_1/touchpoints");

  const markComplete = page.getByRole("button", { name: /mark complete/i }).first();
  await expect(markComplete).toBeVisible();
  await markComplete.click();

  await page.getByRole("combobox", { name: /outcome/i }).click();
  await page.getByRole("option", { name: /positive/i }).click();
  await page.getByLabel(/notes/i).fill("Automated end-to-end test — call went well.");

  await page.getByRole("button", { name: /^complete$/i }).click();

  await expect(page.getByText(/touchpoint marked complete/i)).toBeVisible({ timeout: 10_000 });

  // The completed touchpoint now carries its outcome and drops the
  // "mark complete" action — it's no longer scheduled or overdue.
  await expect(page.getByText(/^positive$/i).first()).toBeVisible();
});
