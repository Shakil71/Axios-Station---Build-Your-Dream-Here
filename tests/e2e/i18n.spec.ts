import { expect, test } from "@playwright/test";

/** Bengali (/bn) version of the public site. */
const BN_PAGES = ["/bn", "/bn/about", "/bn/services", "/bn/solutions", "/bn/industries", "/bn/portfolio", "/bn/team", "/bn/contact", "/bn/privacy"];

test.describe("bengali site", () => {
  for (const path of BN_PAGES) {
    test(`${path} renders in Bengali without errors or overflow`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      page.on("pageerror", (e) => errors.push(e.message));
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1").first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.lang)).toBe("bn");
      // Bengali script in the navigation proves the UI dictionary is applied.
      await expect(page.locator("header")).toContainText(/[ঀ-৿]/);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
      expect(errors).toEqual([]);
    });
  }

  test("CMS content is translated, with English fallback where no translation exists", async ({ request }) => {
    const bn = await (await request.get("/bn")).text();
    expect(bn).toContain("আপনার স্বপ্ন গড়ুন এখানেই।");
    const en = await (await request.get("/")).text();
    expect(en).toContain("Build Your Dream Here.");
    expect(en).not.toContain("আপনার স্বপ্ন গড়ুন এখানেই।");
  });

  test("internal links stay in the visitor's language", async ({ request }) => {
    const html = await (await request.get("/bn/services")).text();
    const internal = [...html.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1]!).filter((h) => !/^\/(_next|images|uploads|api|admin)/.test(h) && !/\.[a-z0-9]{2,12}(\?|$)/i.test(h)); // pages only, not files
    const unprefixed = internal.filter((h) => h !== "/bn" && !h.startsWith("/bn/"));
    // Only the language switcher may point to the English site.
    expect(unprefixed).toEqual(["/services"]);
  });

  test("hreflang alternates and the sitemap list both languages", async ({ request }) => {
    const html = await (await request.get("/services")).text();
    expect(html).toMatch(/hrefLang="bn" href="[^"]*\/bn\/services"/);
    expect(html).toMatch(/hrefLang="x-default"/);
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/bn/services</loc>");
  });

  test("/en URLs redirect to the clean English URL", async ({ request }) => {
    const res = await request.get("/en/services", { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(res.headers()["location"]).toMatch(/\/services$/);
  });

  test("language switcher moves between English and Bengali on the same page", async ({ page }) => {
    await page.goto("/services");
    await page.getByRole("link", { name: "পড়ুন বাংলায়" }).first().click();
    await expect(page).toHaveURL(/\/bn\/services$/);
    await expect(page.locator("h1").first()).toContainText(/[ঀ-৿]/);
    await page.getByRole("link", { name: "Read in English" }).first().click();
    await expect(page).toHaveURL(/\/services$/);
    await expect(page.locator("h1").first()).toHaveText("Engineering services for every stage of growth");
  });

  test("contact form answers in Bengali", async ({ page }) => {
    await page.goto("/bn/contact");
    await page.getByRole("button", { name: "বার্তা পাঠান" }).click();
    await expect(page.getByText("চিহ্নিত ঘরগুলো ঠিক করুন।")).toBeVisible();
    await expect(page.getByText("আপনার নাম লিখুন।")).toBeVisible();
  });

  test("unknown Bengali pages show a Bengali 404", async ({ page }) => {
    const res = await page.goto("/bn/this-page-does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "এই পাতাটি নেই" })).toBeVisible();
  });
});

const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

test.describe("admin translations", () => {
  test.skip(!email || !password, "E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD not set");
  test.skip(({ isMobile }) => isMobile, "desktop only");
  test.use({ viewport: { width: 1440, height: 900 } });

  test("add a Bengali version of a service and see it on /bn", async ({ page }) => {
    const slug = `e2e-bn-${Date.now()}`;
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin$/);

    await page.goto("/admin/content/services/new");
    await page.getByLabel(/^Title/).fill("E2E Translation Service");
    await page.getByLabel(/^Slug/).fill(slug);
    await page.getByLabel(/^Short description/).fill("English description for the translation test.");
    await page.getByLabel(/^Status/).selectOption("PUBLISHED");
    await page.getByRole("button", { name: /^create$/i }).click();
    await expect(page).toHaveURL(/\/admin\/content\/services\/(?!new)/);
    const editUrl = page.url();

    await page.getByRole("button", { name: /Bengali translation/ }).click();
    await page.getByLabel("বাংলা · Title").fill("ই২ই অনুবাদ সেবা");
    await page.getByLabel("বাংলা · Short description").fill("অনুবাদ পরীক্ষার জন্য বাংলা বিবরণ।");
    await Promise.all([
      page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/admin/content/services/")),
      page.getByRole("button", { name: "Save Bengali version" }).click(),
    ]);
    await expect(page.getByText("Bengali translation saved.")).toBeVisible();

    const bn = await (await page.request.get(`/bn/services/${slug}`)).text();
    expect(bn).toContain("ই২ই অনুবাদ সেবা");
    const en = await (await page.request.get(`/services/${slug}`)).text();
    expect(en).toContain("E2E Translation Service");
    expect(en).not.toContain("ই২ই অনুবাদ সেবা");

    // Clean up: clear the translation (empty = remove), then delete the service.
    await page.goto(editUrl);
    await page.getByRole("button", { name: /Bengali translation/ }).click();
    await page.getByLabel("বাংলা · Title").fill("");
    await page.getByLabel("বাংলা · Short description").fill("");
    await Promise.all([
      page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/admin/content/services/")),
      page.getByRole("button", { name: "Save Bengali version" }).click(),
    ]);
    await expect(page.getByText(/Bengali translation saved|Nothing to save/)).toBeVisible();
    await page.goto(`/admin/content/services?q=${encodeURIComponent("E2E Translation Service")}`);
    await page.getByRole("checkbox", { name: "Select row" }).first().check();
    await page.getByRole("button", { name: "Delete" }).last().click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText(/deleted 1 item/i)).toBeVisible();
  });
});
