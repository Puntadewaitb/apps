import { expect, test } from "@playwright/test";
import { site } from "../content/site";

const widths = [360, 768, 1280];

for (const width of widths) {
  test(`tanpa horizontal overflow di ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const m = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      bodyScrollWidth: document.body.scrollWidth,
    }));
    expect(m.scrollWidth).toBeLessThanOrEqual(m.innerWidth);
    expect(m.bodyScrollWidth).toBeLessThanOrEqual(m.innerWidth);
  });
}

test("semua section utama tampil dengan konten dari site.ts", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(site.hero.headline);
  for (const [id, title] of [
    ["masalah", site.problem.title],
    ["keunggulan", site.features.title],
    ["paket", site.showcase.title],
  ] as const) {
    await expect(page.locator(`#${id} h2`)).toHaveText(title);
  }
  await expect(page.locator("#solusi h2")).toHaveText(site.solution.title);
  await expect(page.locator("#masalah li")).toHaveCount(site.problem.items.length);
  await expect(page.locator("#keunggulan li")).toHaveCount(site.features.items.length);
  await expect(page.locator("#paket h3")).toHaveCount(site.showcase.items.length);
});

test("gambar showcase termuat (bukan broken) dan punya alt", async ({ page }) => {
  await page.goto("/");
  const imgs = page.locator("img");
  const n = await imgs.count();
  expect(n).toBeGreaterThanOrEqual(4);
  for (let i = 0; i < n; i++) {
    const img = imgs.nth(i);
    await img.scrollIntoViewIfNeeded();
    await expect(img).toHaveAttribute("alt", /.+/);
    await expect
      .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
      .toBe(true);
  }
});

test("menu mobile membuka dan menutup", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Buka menu" });
  await toggle.click();
  await expect(page.getByRole("navigation", { name: "Menu mobile" })).toBeVisible();
  await page
    .getByRole("navigation", { name: "Menu mobile" })
    .getByRole("link", { name: "Paket" })
    .click();
  await expect(page.getByRole("navigation", { name: "Menu mobile" })).toBeHidden();
});
