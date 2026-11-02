import { expect, test } from "@playwright/test";

test("beranda menampilkan data acara dari database (seed)", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  await expect(page).toHaveTitle("Pernikahan Raka & Anisa");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Raka");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Anisa");
  await expect(page.getByTestId("tanggal-akad")).toHaveText("Sabtu, 20 Februari 2027");
  await expect(page.getByText("08.00 WIB")).toBeVisible();
  await expect(page.getByText("11.00 WIB")).toBeVisible();
  await expect(page.getByText("Gedung Serbaguna Melati")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "id");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "hangat");
});

test("seed lengkap: 1 acara, 3 tamu, RSVP & ucapan demo", async () => {
  const { default: Database } = await import("better-sqlite3");
  const d = new Database("e2e.db", { readonly: true, fileMustExist: true });
  const n = (t: string) => (d.prepare(`SELECT COUNT(*) c FROM ${t}`).get() as { c: number }).c;
  expect([n("Event"), n("Guest"), n("Rsvp"), n("Wish")]).toEqual([1, 3, 1, 2]);
  d.close();
});

test("tidak ada horizontal overflow di 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(over).toBe(false);
});

test("security headers & robots noindex", async ({ page, request }) => {
  const res = await request.get("/");
  const h = res.headers();
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-powered-by"]).toBeUndefined();
  await page.goto("/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("404 berbahasa Indonesia", async ({ page }) => {
  const res = await page.goto("/tidak-ada");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Undangan tidak ditemukan");
});
