import { expect, test } from "@playwright/test";

/**
 * Team management: create a member with contact details and social links,
 * check the privacy switch on /team, then delete.
 * Requires E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD (a Super Admin account).
 */
const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

test.describe("admin team", () => {
  test.skip(!email || !password, "E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD not set");
  test.skip(({ isMobile }) => isMobile, "desktop only");
  test.use({ viewport: { width: 1440, height: 900 } });

  test("create a member with contact details, toggle visibility, delete", async ({ page }) => {
    const slug = `e2e-member-${Date.now()}`;
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin$/);

    await page.goto("/admin/content/team/new");
    await page.getByLabel(/^Name/).fill("E2E Team Member");
    await page.getByLabel(/^Slug/).fill(slug);
    await page.getByLabel(/^Position/).fill("Test Engineer");
    await page.getByLabel(/^Department/).selectOption("Quality Assurance");
    await page.getByLabel(/^Experience/).fill("3+ years");
    await page.getByLabel(/^Email/).fill("e2e-member@example.com");
    await page.getByLabel(/^Phone/).fill("+880 1700-000000");
    await page.getByLabel(/^WhatsApp number/).fill("+8801700000000");
    await page.getByLabel(/^Facebook URL/).fill("https://www.facebook.com/example");
    await page.getByLabel(/^Status/).selectOption("PUBLISHED");
    await page.getByRole("button", { name: /^create$/i }).click();
    await expect(page).toHaveURL(/\/admin\/content\/team\/(?!new)/);

    // Contact hidden by default; social link visible.
    let html = await (await page.request.get("/team")).text();
    expect(html).toContain("E2E Team Member");
    expect(html).toContain("3+ years");
    expect(html).toContain("https://www.facebook.com/example");
    expect(html).not.toContain("e2e-member@example.com");
    expect(html).not.toContain("tel:+8801700000000");

    // Opt in → email, phone and WhatsApp appear.
    await page.getByLabel(/^Show email, phone/).check();
    // Wait for the server action to finish before reading the public page.
    await Promise.all([
      page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/admin/content/team/")),
      page.getByRole("button", { name: /^save/i }).click(),
    ]);
    await expect(page.getByText("All changes saved")).toBeVisible();
    html = await (await page.request.get("/team")).text();
    expect(html).toContain("mailto:e2e-member@example.com");
    expect(html).toContain("tel:+8801700000000");
    expect(html).toContain("https://wa.me/8801700000000");

    await page.goto(`/admin/content/team?q=${encodeURIComponent("E2E Team Member")}`);
    await page.getByRole("checkbox", { name: "Select row" }).first().check();
    await page.getByRole("button", { name: "Delete" }).last().click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText(/deleted 1 item/i)).toBeVisible();
  });
});
