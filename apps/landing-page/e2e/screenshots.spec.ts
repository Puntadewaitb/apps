import { test } from "@playwright/test";
import { ADMIN_PASSWORD, uniqueIp } from "./helpers";

/**
 * Membuat screenshot untuk README. Hanya jalan bila SCREENSHOTS=1:
 *   SCREENSHOTS=1 npx playwright test e2e/screenshots.spec.ts
 * Jam dikunci agar countdown promo konsisten.
 */
test.skip(!process.env.SCREENSHOTS, "set SCREENSHOTS=1 untuk membuat ulang screenshot");

const OUT = "docs/screenshots";

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-12-20T10:00:00+07:00") });
  await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
});

test("desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.screenshot({ path: `${OUT}/desktop-hero.png` });
  await page.locator("#paket").scrollIntoViewIfNeeded();
  await page.locator("#paket").screenshot({ path: `${OUT}/desktop-paket.png` });
});

test("mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.screenshot({ path: `${OUT}/mobile-hero.png` });
  await page.locator("#kontak").screenshot({ path: `${OUT}/mobile-form.png` });
});

test("admin leads", async ({ page, request }) => {
  for (const [name, msg] of [
    ["Rina Wulandari", "Mau tanya paket Toko untuk 2 kasir."],
    ["Agus Prasetyo", "Apakah bisa impor data dari Excel?"],
  ] as const) {
    await request.post("/api/leads", {
      headers: { "x-forwarded-for": uniqueIp() },
      data: { name, phone: "081234567890", message: msg },
    });
  }
  await page.setViewportSize({ width: 1280, height: 640 });
  await page.goto("/admin/login");
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Masuk" }).click();
  await page.waitForURL(/\/admin\/leads$/);
  await page.screenshot({ path: `${OUT}/admin-leads.png` });
});
