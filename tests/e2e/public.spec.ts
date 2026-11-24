import { expect, test } from "@playwright/test";

const PAGES = ["/", "/about", "/services", "/solutions", "/industries", "/portfolio", "/team", "/blog", "/contact", "/privacy", "/terms"];

test.describe("public site", () => {
  for (const path of PAGES) {
    test(`${path} renders without console errors or horizontal overflow`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      page.on("pageerror", (e) => errors.push(e.message));
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1").first()).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
      expect(errors).toEqual([]);
    });
  }

  test("service detail pages are reachable from the listing", async ({ page }) => {
    await page.goto("/services");
    const first = page.locator('a[href^="/services/"]').first();
    await first.click();
    await expect(page).toHaveURL(/\/services\/.+/);
    await expect(page.getByRole("heading", { name: /key features|service overview/i }).first()).toBeVisible();
  });

  test("legal pages have real content", async ({ page }) => {
    for (const [path, heading] of [["/privacy", /how we use your information/i], ["/terms", /governing law/i]] as const) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    }
  });

  test("team page publishes Person structured data", async ({ request }) => {
    const html = await (await request.get("/team")).text();
    expect(html).toContain('"@type":"Person"');
    expect(html).toContain('"jobTitle"');
  });

  test("desktop dropdown opens on click and closes after choosing, outside click and Escape", async ({ page, isMobile }) => {
    test.skip(isMobile, "desktop only");
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const button = page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Company" });
    const menu = page.locator(`#${await button.getAttribute("aria-controls")}`);
    await button.hover();
    await page.waitForTimeout(400);
    await expect(menu).toBeHidden(); // hover alone never opens it

    await button.click();
    await expect(menu).toBeVisible();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await page.mouse.click(5, 500);
    await expect(menu).toBeHidden();

    await button.click();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();

    await button.click();
    await menu.getByRole("link", { name: "About Us" }).click();
    await expect(page).toHaveURL(/\/about$/);
    await page.mouse.move(5, 500);
    await expect(menu).toBeHidden();
    await expect(button).toHaveAttribute("aria-expanded", "false");
  });

  test("mobile menu opens and closes", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile only");
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog", { name: "Menu" });
    await expect(menu).toBeVisible();
    await menu.getByRole("button", { name: "Close menu" }).click();
    await expect(menu).toBeHidden();
  });

  test("security headers are present", async ({ request }) => {
    const res = await request.get("/");
    expect(res.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(res.headers()["x-content-type-options"]).toBe("nosniff");
    expect(res.headers()["x-powered-by"]).toBeUndefined();
  });

  test("sitemap and robots", async ({ request }) => {
    expect((await request.get("/sitemap.xml")).status()).toBe(200);
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /admin");
  });

  test("contact form validates on the server", async ({ page }) => {
    await page.goto("/contact");
    await page.getByRole("button", { name: /send message/i }).click();
    await expect(page.getByText(/please fix the highlighted fields/i)).toBeVisible();
  });

  test("unknown pages return 404", async ({ page }) => {
    const res = await page.goto("/this-page-does-not-exist-xyz");
    expect(res?.status()).toBe(404);
  });
});

test.describe("admin protection", () => {
  test("admin redirects anonymous users to login", async ({ page }) => {
    await page.goto("/admin/content/services");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("admin APIs reject anonymous requests", async ({ request }) => {
    expect((await request.get("/api/admin/media")).status()).toBe(403);
    expect((await request.get("/api/admin/export/leads")).status()).toBe(403);
  });

  test("wrong credentials are rejected", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill("nobody@example.com");
    await page.getByLabel("Password").fill("definitely-wrong-123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/invalid email or password|too many|temporarily unavailable/i)).toBeVisible({ timeout: 20_000 });
  });
});
