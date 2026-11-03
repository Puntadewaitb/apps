import { test } from "@playwright/test";
import { awasi, login, uniqueIp } from "./helpers";

/**
 * Membuat screenshot untuk README. Hanya jalan bila SCREENSHOTS=1:
 *   SCREENSHOTS=1 npx playwright test e2e/screenshots.spec.ts --project=fitur
 * Google Maps diblok (tidak ada akses internet); kalender memakai tanggal relatif data seed.
 */
test.skip(!process.env.SCREENSHOTS, "set SCREENSHOTS=1 untuk membuat ulang screenshot");

const OUT = "docs/screenshots";

test.beforeEach(async ({ page }) => {
  await awasi(page);
  await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
});

test("publik (desktop)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.screenshot({ path: `${OUT}/beranda.png` });
  await page.goto("/profil");
  await page.locator("#struktur").screenshot({ path: `${OUT}/struktur-organisasi.png` });
  await page.goto("/berita");
  await page.screenshot({ path: `${OUT}/berita.png` });
  await page.goto("/agenda");
  await page.locator("#kalender").screenshot({ path: `${OUT}/agenda-kalender.png` });
  await page.goto("/galeri/pentas-seni-2026");
  await page.screenshot({ path: `${OUT}/galeri.png` });
  await page.goto("/donasi/beasiswa-siswa-berprestasi");
  await page.screenshot({ path: `${OUT}/donasi.png` });
});

test("PPDB (wizard) & mobile", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/ppdb/daftar");
  await page.screenshot({ path: `${OUT}/ppdb-langkah-1.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.screenshot({ path: `${OUT}/mobile-beranda.png` });
});

test("admin", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await login(page);
  await page.screenshot({ path: `${OUT}/admin-dashboard.png` });
  await page.goto("/admin/berita/baru");
  await page.getByRole("textbox", { name: "Judul", exact: true }).fill("Contoh tulisan baru");
  await page.screenshot({ path: `${OUT}/admin-editor-berita.png` });
});
