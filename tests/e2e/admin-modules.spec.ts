import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

/**
 * Smoke-tests every admin module against a seeded database and checks the
 * lead pipeline and media upload end-to-end.
 * Requires E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD (Super Admin).
 */
const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

const ADMIN_PAGES = [
  "/admin",
  "/admin/homepage",
  "/admin/homepage?page=about",
  "/admin/media",
  "/admin/leads",
  "/admin/newsletter",
  "/admin/users",
  "/admin/users/new",
  "/admin/roles",
  "/admin/activity",
  "/admin/analytics",
  "/admin/ai",
  "/admin/maintenance",
  ...["general", "contact", "social", "theme", "footer", "leads", "analytics"].map((g) => `/admin/settings/${g}`),
  ...[
    "services", "solutions", "industries", "projects", "project-categories", "team", "blog-posts", "blog-categories",
    "blog-tags", "testimonials", "faqs", "pages", "seo", "redirects", "navigation-items",
  ].flatMap((r) => [`/admin/content/${r}`, `/admin/content/${r}/new`]),
];

async function signIn(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test.describe("admin modules", () => {
  test.skip(!email || !password, "E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD not set");
  test.skip(({ isMobile }) => isMobile, "desktop only");
  test.describe.configure({ mode: "serial" });

  test("every admin page renders without errors", async ({ page }) => {
    test.setTimeout(180_000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await signIn(page);
    for (const p of ADMIN_PAGES) {
      const res = await page.goto(p);
      expect(res?.status(), p).toBe(200);
      await expect(page.locator("h1").first(), p).toBeVisible();
      await expect(page.getByText(/something went wrong|application error/i), p).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });

  test("a contact form submission appears in Leads and can be updated", async ({ page }) => {
    const name = `E2E Lead ${Date.now()}`;
    await page.goto("/contact");
    await page.waitForTimeout(2800); // spam guard rejects instant submissions
    await page.getByLabel("Full name *").fill(name);
    await page.getByLabel("Email *").fill("e2e-lead@example.com");
    await page.getByLabel("Project description *").fill("We need a cloud-based hotel management system for two properties.");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /send message/i }).click();
    await expect(page.getByText(/message received/i)).toBeVisible();

    await signIn(page);
    await page.goto(`/admin/leads?q=${encodeURIComponent(name)}`);
    await page.getByRole("link", { name }).click();
    await page.getByLabel("Status").selectOption("QUALIFIED");
    await page.getByRole("button", { name: /update lead/i }).click();
    await expect(page.getByText(/lead updated/i)).toBeVisible();
    await page.reload();
    await expect(page.getByText(/status changed from NEW to QUALIFIED/i)).toBeVisible();

    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /^delete$/i }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: /delete/i }).click();
    await expect(page).toHaveURL(/\/admin\/leads$/);
  });

  test("media upload, alt text and delete", async ({ page }) => {
    await signIn(page);
    await page.goto("/admin/media");
    const file = path.resolve("public/images/brand/axios-mark.png");
    await page.locator('input[type="file"]').setInputFiles(file);
    await expect(page.getByText(/uploaded 1 file/i)).toBeVisible({ timeout: 20_000 });
    // Open the file we just uploaded (never a seeded/in-use item). Uploads are re-encoded to WebP.
    await page.goto("/admin/media?q=axios-mark");
    await page.locator('a[href^="/admin/media/"]', { hasText: /axios-mark/ }).first().click();
    await expect(page.getByText(/not used anywhere/i)).toBeVisible();
    await page.getByLabel("Alt text").fill("E2E uploaded logo");
    await page.getByRole("button", { name: /save details/i }).click();
    await expect(page.getByText(/media details saved/i)).toBeVisible();
    await page.getByRole("button", { name: /delete file/i }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: /delete file/i }).click();
    await expect(page).toHaveURL(/\/admin\/media$/);
  });
});
