import { expect, test } from "@playwright/test";
import { site } from "../content/site";

test("beranda merespons 200 dan menampilkan teks hero", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(site.hero.headline);
  await expect(page.getByText(site.hero.subheadline)).toBeVisible();
  await expect(page.getByRole("link", { name: site.hero.cta.label }).first()).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "id");
});

test("tautan WhatsApp mengarah ke wa.me (tanpa navigasi)", async ({ page }) => {
  await page.goto("/");
  const wa = page.getByRole("link", { name: site.whatsapp.label });
  await expect(wa).toHaveAttribute("href", /^https:\/\/wa\.me\/6281234567890\?text=/);
});

test("security headers terpasang", async ({ request }) => {
  const res = await request.get("/");
  const h = res.headers();
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-powered-by"]).toBeUndefined();
});
