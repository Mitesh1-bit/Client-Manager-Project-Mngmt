import { expect, test } from "@playwright/test";

import { USERS, login } from "./helpers/auth";

test("a client can approve a milestone waiting on their sign-off", async ({ page }) => {
  await login(page, USERS.clientNorthwind);

  // mst_3 ("Booking flow ready for review") already has internal sign-off in
  // the fixtures and one outstanding CLIENT approval assigned to Marcus Bell.
  await page.goto("/portal/projects/prj_1");

  const awaitingSection = page.getByRole("region", { name: /waiting on you/i });
  await expect(awaitingSection).toBeVisible();

  const panel = awaitingSection.getByRole("region", { name: /booking flow ready for review/i });
  await expect(panel).toBeVisible();

  await panel.getByRole("button", { name: /^approve$/i }).click();
  await panel.getByRole("button", { name: /confirm approval/i }).click();

  await expect(page.getByText(/Booking flow ready for review.{0,3}approved/i)).toBeVisible({
    timeout: 10_000,
  });

  // The milestone completes once every client approval is in, and drops out
  // of "Waiting on you" since there's nothing left to decide.
  await expect(page.getByRole("region", { name: /waiting on you/i })).toHaveCount(0);
  const planItem = page.getByRole("listitem").filter({ hasText: "Booking flow ready for review" });
  await expect(planItem.getByText(/completed/i)).toBeVisible();
});
