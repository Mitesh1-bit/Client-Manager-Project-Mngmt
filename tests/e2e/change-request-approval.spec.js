import { expect, test } from "@playwright/test";

import { USERS, login } from "./helpers/auth";

test("a client can submit a change request", async ({ page }) => {
  await login(page, USERS.clientNorthwind);

  await page.goto("/portal/change-requests/new");

  // Northwind has more than one project, so the project field has no
  // single-option default — it has to be picked explicitly, same as a real client would.
  await page.getByRole("combobox", { name: /^project/i }).click();
  await page.getByRole("option", { name: "Patient Portal Redesign" }).click();

  // Required `FormField` labels render their asterisk right after the text
  // (e.g. "Title*", no separating space) — an anchored regex would never match.
  const title = `Playwright test request ${Date.now()}`;
  await page.getByLabel(/^title/i).fill(title);
  await page.getByLabel(/tell us more/i).fill(
    "Automated end-to-end test — please add a short note here describing the change.",
  );

  await page.getByRole("button", { name: /send request/i }).click();

  await page.waitForURL(/\/portal\/change-requests\/(?!new$)[^/]+$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByText(/submitted/i).first()).toBeVisible();
});

test("internal sign-off already given — a client can approve a pending change request", async ({
  page,
}) => {
  await login(page, USERS.clientNorthwind);

  // CR-1042 (chr_1) already has internal sign-off in the fixtures and is
  // waiting on the client — exactly the state `canDecide` requires to let a
  // client approver act.
  await page.goto("/portal/change-requests/chr_1");
  await expect(page.getByRole("heading", { name: /insurance eligibility/i })).toBeVisible();

  const decisionSection = page.getByRole("region", { name: /your decision/i });
  await expect(decisionSection).toBeVisible();

  await decisionSection.getByRole("button", { name: /approve this change/i }).click();

  await expect(page.getByText(/CR-1042 approved/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/marcus bell approved/i)).toBeVisible();

  // The decision panel is gone now that there's nothing left for this client to decide.
  await expect(page.getByRole("button", { name: /approve this change/i })).toHaveCount(0);

  // And the change persisted — the queue-wide status now reads Approved.
  await page.goto("/portal/change-requests");
  await expect(
    page.getByRole("link", { name: /add insurance eligibility check to booking/i }),
  ).toBeVisible();
});
