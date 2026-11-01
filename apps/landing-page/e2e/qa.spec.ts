import { expect, test, type Page } from "@playwright/test";
import { site } from "../content/site";

/** Kumpulkan error konsol & error JS halaman selama tes. */
function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

for (const path of ["/", "/admin/login"]) {
  test(`${path} termuat tanpa error konsol/JS`, async ({ page }) => {
    const errors = trackErrors(page);
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await page.waitForLoadState("load");
    expect(errors).toEqual([]);
  });
}

test("404 berbahasa Indonesia dengan tautan kembali", async ({ page }) => {
  const res = await page.goto("/halaman-yang-tidak-ada");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Halaman tidak ditemukan");
  await expect(page.getByRole("link", { name: "Kembali ke beranda" })).toHaveAttribute("href", "/");
  await expect(page.locator("body")).not.toContainText("could not be found");
});

test("aksesibilitas dasar: satu h1, landmark, alt gambar, label input, lang", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "id");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.locator("header").first()).toBeVisible();
  await expect(page.locator("footer").last()).toBeVisible();
  for (const img of await page.locator("img").all()) {
    expect((await img.getAttribute("alt"))?.trim()).toBeTruthy();
  }
  // setiap input/textarea yang terlihat punya label yang terhubung
  const unlabeled = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLInputElement>("input, textarea, select")]
      .filter((el) => el.offsetParent !== null && el.type !== "hidden")
      .filter((el) => !(el.labels && el.labels.length > 0) && !el.getAttribute("aria-label"))
      .map((el) => el.name),
  );
  expect(unlabeled).toEqual([]);
});

test("semua tautan anchor internal menunjuk section yang ada", async ({ page }) => {
  await page.goto("/");
  const hrefs = await page
    .locator('a[href^="#"]')
    .evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute("href")!))]);
  expect(hrefs.length).toBeGreaterThan(3);
  for (const h of hrefs) {
    if (h === "#") continue; // tautan placeholder footer (kebijakan privasi, dll.)
    await expect(page.locator(h), `target ${h}`).toHaveCount(1);
  }
});

test("CTA utama hero mengarah ke form kontak & form terlihat", async ({ page }) => {
  await page.goto("/");
  await page.locator("main").getByRole("link", { name: site.hero.cta.label }).click();
  await expect(page).toHaveURL(/#kontak$/);
  await expect(page.getByRole("form", { name: "Form kontak" })).toBeInViewport();
});

test("navigasi keyboard: Tab pertama fokus ke elemen interaktif yang terlihat", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return el ? { tag: el.tagName, visible: el.offsetParent !== null } : null;
  });
  expect(focused?.tag).toMatch(/^(A|BUTTON)$/);
  expect(focused?.visible).toBe(true);
});
