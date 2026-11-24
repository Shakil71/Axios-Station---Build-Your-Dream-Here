import { expect, test } from "@playwright/test";

/**
 * Full CRUD flow against a seeded database.
 * Requires E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD (a Super Admin account).
 */
const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

test.describe("admin CRUD", () => {
  test.skip(!email || !password, "E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD not set");
  test.use({ viewport: { width: 1440, height: 900 } });

  test("sign in, create, publish, view, unpublish and delete a service", async ({ page }) => {
    const slug = `e2e-service-${Date.now()}`;
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin$/);

    await page.goto("/admin/content/services/new");
    await page.getByLabel(/^Title/).fill("E2E Test Service");
    await page.getByLabel(/^Slug/).fill(slug);
    await page.getByLabel(/^Short description/).fill("Created by the end-to-end test suite.");
    await page.getByLabel(/^Status/).selectOption("PUBLISHED");
    await page.getByRole("button", { name: /^create$/i }).click();
    await expect(page).toHaveURL(/\/admin\/content\/services\/(?!new)/);

    const pub = await page.request.get(`/services/${slug}`);
    expect(pub.status()).toBe(200);
    expect(await pub.text()).toContain("E2E Test Service");

    await page.goto(`/admin/content/services?q=${slug}`);
    await page.getByRole("checkbox", { name: "Select row" }).first().check();
    await page.getByRole("button", { name: "Unpublish" }).click();
    await page.getByRole("button", { name: "Confirm" }).click();
    await expect(page.getByText(/moved to draft/i)).toBeVisible();
    expect((await page.request.get(`/services/${slug}`)).status()).toBe(404);

    await page.getByRole("button", { name: "Delete" }).last().click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText(/deleted 1 item/i)).toBeVisible();
  });
});
