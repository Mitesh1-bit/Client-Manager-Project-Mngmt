const PASSWORD = "meridian";

export const USERS = {
  admin: "amara@meridian.studio",
  pm: "priya@meridian.studio",
  accountManager: "tomas@meridian.studio",
  clientNorthwind: "marcus.bell@northwind.health",
  clientHalcyon: "s.almeida@halcyonretail.com",
};

/** Signs in through the real login form and waits for the post-login redirect. */
export async function login(page, email, password = PASSWORD) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 });
}
